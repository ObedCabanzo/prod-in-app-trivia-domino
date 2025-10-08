
/* ============================================================================
   Asset Preloader con Sets/Subsets + Eventos con contexto (set/subset)
   - Avanza por subset (fonts, images, gifs, audio, videos, videoPortions)
   - Emite assetpreloader:setstart|subsetstart|subsetcomplete|setcomplete|allcomplete
   - Contexto extra: { setIndex, setName, subsetsTotal, subsetIndex }
============================================================================ */
(function () {
  // ---------------------------- Utils de tiempo -----------------------------
  const now = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now();

  let failedSetBase = {
    name: "failedAssets",
    fonts: [],
    images: [],
    gifs: [],
    audio: [],
    videos: [],
    videoPortions: [],
  }

  window.failedSet = window.failedSet || { ...failedSetBase };
  const failedSet = window.failedSet;

  // ----------------------------- Conexión temprana --------------------------
  function uniqueHostsFromSets(sets) {
    const urls = [];
    for (const s of sets) {
      const collect = (arr) => arr && urls.push(...arr);
      collect(s.images);
      collect(s.gifs);
      collect(s.audio);
      collect(s.videos);
      if (s.fonts) urls.push(...s.fonts.map((f) => f.url));
      if (s.videoPortions) urls.push(...s.videoPortions.map((v) => v.url));
      if (s.preconnect) urls.push(...s.preconnect);
    }
    const hosts = new Set();
    for (const u of urls) {
      try {
        const { protocol, host } = new URL(u);
        hosts.add(`${protocol}//${host}`);
      } catch (_) {}
    }
    return [...hosts];
  }

  function preconnectHosts(hosts) {
    for (const href of hosts) {
      const link1 = document.createElement("link");
      link1.rel = "preconnect";
      link1.href = href;
      link1.crossOrigin = "anonymous";
      document.head.appendChild(link1);

      const link2 = document.createElement("link");
      link2.rel = "dns-prefetch";
      link2.href = href;
      document.head.appendChild(link2);
    }
  }

  // ----------------------------- Concurrencia genérica ----------------------
  async function withConcurrency(items, worker, max = 6) {
    if (!items || !items.length) return [];
    const out = new Array(items.length);
    let i = 0;
    async function runner() {
      while (i < items.length) {
        const idx = i++;
        try {
          out[idx] = await worker(items[idx], idx);
        } catch (e) {
          console.warn(e);
          out[idx] = null;
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(max, items.length) }, runner)
    );
    return out;
  }

  // ----------------------------- Workers de preload -------------------------
  function injectFontPreloadLink(url) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.href = url;
    link.type = "font/otf";
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    return link;
  }

  async function preloadFont({
    family,
    url,
    descriptors = { style: "normal", weight: "400" },
  }) {
    injectFontPreloadLink(url);
    try {
      const face = new FontFace(
        family,
        `url("${url}") format("opentype")`,
        descriptors
      );
      const loaded = await face.load();
      document.fonts.add(loaded);
      return { ok: true, face: loaded, url, family };
    } catch (e) {
      failedSet.fonts.push({ url, family, descriptors, error: e });
      console.warn(`FontFace failed: ${family}`, e);
      return { ok: false, error: e, url, family };
    }
  }

  function preloadImage(
    url,
    { priority = "auto", crossOrigin = "anonymous" } = {}
  ) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if ("fetchPriority" in img) img.fetchPriority = priority;
      img.crossOrigin = crossOrigin;
      const done = () =>
        (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).finally(
          () => resolve({ ok: true, node: img, url })
        );
      img.addEventListener("load", done, { once: true });
      img.addEventListener(
        "error",
        () => {
          failedSet.images.push(url);
          reject(new Error(`Image failed: ${url}`));
        },
        { once: true }
      );
      img.src = url;
    });
  }

  function preloadAudio(
    url,
    { crossOrigin = "anonymous", timeoutMs = 8000 } = {}
  ) {
    return new Promise((resolve) => {
      const a = new Audio();
      a.crossOrigin = crossOrigin;
      a.preload = "auto";
      let to = setTimeout(() => {
        cleanup();
        resolve({ ok: true, node: a, url, timedOut: true });
      }, timeoutMs);
      const cleanup = () => {
        clearTimeout(to);
        a.removeEventListener("canplaythrough", ok);
        a.removeEventListener("error", err);
      };
      const ok = () => {
        cleanup();
        resolve({ ok: true, node: a, url });
      };
      const err = () => {
        cleanup();
        resolve({ ok: false, node: a, url });
      };
      a.addEventListener("canplaythrough", ok, { once: true });
      a.addEventListener("error", err, { once: true });
      a.src = url;
      try {
        a.load();
      } catch (e) {
        console.warn(`Audio load failed: ${url}`, e);
        failedSet.audio.push({ url, error: e });
      }
    });
  }

  function preloadVideo(
    url,
    { crossOrigin = "anonymous", timeoutMs = 12000 } = {}
  ) {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.crossOrigin = crossOrigin;
      v.preload = "auto";
      let to = setTimeout(() => {
        cleanup();
        resolve({ ok: true, node: v, url, timedOut: true });
      }, timeoutMs);
      const cleanup = () => {
        clearTimeout(to);
        v.removeEventListener("canplaythrough", ok);
        v.removeEventListener("error", err);
      };
      const ok = () => {
        cleanup();
        resolve({ ok: true, node: v, url });
      };
      const err = () => {
        cleanup();
        resolve({ ok: false, node: v, url });
      };
      v.addEventListener("canplaythrough", ok, { once: true });
      v.addEventListener("error", err, { once: true });
      v.src = url;
      try {
        v.load();
      } catch (_) {}
    });
  }

  async function preloadVideoPortion(url, portion = 0.25) {
    let total = null;
    try {
      const head = await fetch(url, { method: "HEAD" });
      total = Number(head.headers.get("content-length")) || null;
    } catch (_) {}

    if (!total) {
      try {
        const probe = await fetch(url, { headers: { Range: "bytes=0-0" } });
        const cr = probe.headers.get("content-range");
        if (cr && /\/(\d+)$/.test(cr)) total = Number(RegExp.$1);
      } catch (_) {}
    }

    if (!total || !Number.isFinite(total)) {
      const v = document.createElement("video");
      v.preload = "auto";
      v.crossOrigin = "anonymous";
      v.src = url;
      try {
        v.load();
      } catch (_) {}
      return { ok: true, partial: false, total: 0, bytes: 0, url, node: v };
    }

    const endByte = Math.max(0, Math.floor(total * portion) - 1);
    const resp = await fetch(url, {
      headers: { Range: `bytes=0-${endByte}` },
    }).catch(() => null);
    if (!resp || (resp.status !== 206 && resp.status !== 200)) {
      const v = document.createElement("video");
      v.preload = "auto";
      v.crossOrigin = "anonymous";
      v.src = url;
      try {
        v.load();
      } catch (e) {
        failedSet.videos.push( url, );
      }
      return { ok: true, partial: false, total, bytes: 0, url, node: v };
    }

    const buf = await resp.arrayBuffer();
    return {
      ok: true,
      partial: true,
      total,
      bytes: buf.byteLength,
      url,
      buffer: buf,
      range: [0, endByte],
    };
  }

  // ----------------------------- Emisor de eventos --------------------------
  function emitEvent(target, name, detail) {
    const tgt = target || document;
    try {
      tgt.dispatchEvent(
        new CustomEvent(name, {
          detail,
          bubbles: true,
          composed: true,
          cancelable: false,
        })
      );
    } catch (e) {
      const ev = document.createEvent("CustomEvent");
      ev.initCustomEvent(name, true, true, detail);
      tgt.dispatchEvent(ev);
    }
  }

  // ----------------------------- Carga de subsets ---------------------------
  async function loadSubset(kind, payload, conc, callbacks, storeRef, ctx) {
    const t0 = now();
    callbacks?.onSubsetStart?.(kind, payload, ctx);

    let results = [];
    switch (kind) {
      case "fonts":
        results = await withConcurrency(payload || [], preloadFont, conc.fonts);
        storeRef.fonts = Object.fromEntries(
          (payload || []).map((f, i) => [f.family, results[i]?.face || null])
        );
        break;
      case "images":
        results = await withConcurrency(
          payload || [],
          (u) => preloadImage(u, { priority: "high" }),
          conc.images
        );
        storeRef.images = Object.fromEntries(
          results.map((r) => [r?.url, r?.node]).filter(([k, v]) => k && v)
        );
        break;
      case "gifs":
        results = await withConcurrency(
          payload || [],
          (u) => preloadImage(u, { priority: "high" }),
          conc.gifs
        );
        storeRef.gifs = Object.fromEntries(
          results.map((r) => [r?.url, r?.node]).filter(([k, v]) => k && v)
        );
        break;
      case "audio":
        results = await withConcurrency(
          payload || [],
          (u) => preloadAudio(u),
          conc.audio
        );
        storeRef.audio = Object.fromEntries(
          results.map((r) => [r?.url, r?.node]).filter(([k, v]) => k && v)
        );
        break;
      case "videos":
        results = await withConcurrency(
          payload || [],
          (u) => preloadVideo(u),
          conc.videos
        );
        storeRef.videos = Object.fromEntries(
          results.map((r) => [r?.url, r?.node]).filter(([k, v]) => k && v)
        );
        break;
      case "videoPortions":
        results = await withConcurrency(
          payload || [],
          (o) => preloadVideoPortion(o.url, o.portion),
          conc.videoPortions
        );
        storeRef.videoPortions = results;
        break;
      default:
        results = [];
    }

    const ok = results.filter((r) => r && r.ok !== false).length;
    const failed = (results.length || 0) - ok;
    const dt = now() - t0;
    const summary = {
      kind,
      total: results.length || 0,
      ok,
      failed,
      ms: dt,
      ctx, // <-- contexto viaja con el resumen
    };

    callbacks?.onSubsetComplete?.(summary, results);
    return summary;
  }

  // ----------------------------- Carga de sets ------------------------------
  async function loadSet(setDef, index, globalConc, callbacks, eventsTarget) {
    // Descubre subsets activos (con payload)
    const subsetsRaw = [
      ["fonts", setDef.fonts],
      ["images", setDef.images],
      ["gifs", setDef.gifs],
      ["audio", setDef.audio],
      ["videos", setDef.videos],
      ["videoPortions", setDef.videoPortions],
    ];
    const active = subsetsRaw.filter(([, payload]) => payload && payload.length);
    const subsetsTotal = active.length;

    // Avisar inicio del set con info de cuántos subsets trae
    callbacks?.onSetStart?.(index, setDef, { subsetsTotal });

    const conc = {
      fonts: setDef?.concurrency?.fonts ?? globalConc.fonts,
      images: setDef?.concurrency?.images ?? globalConc.images,
      gifs: setDef?.concurrency?.gifs ?? globalConc.gifs,
      audio: setDef?.concurrency?.audio ?? globalConc.audio,
      videos: setDef?.concurrency?.videos ?? globalConc.videos,
      videoPortions:
        setDef?.concurrency?.videoPortions ?? globalConc.videoPortions,
    };

    // Espacio de almacenamiento por set
    window.App = window.App || {};
    window.App.preloaded = window.App.preloaded || {};
    window.App.preloaded.sets = window.App.preloaded.sets || [];
    const storeRef = (window.App.preloaded.sets[index] = {
      name: setDef.name || `set-${index}`,
    });

    // Preconnect de hosts específicos del set
    if (setDef.preconnect && setDef.preconnect.length)
      preconnectHosts(setDef.preconnect);

    // Cargar subsets en paralelo dentro del set
    const subsetPromises = [];
    for (let sIdx = 0; sIdx < active.length; sIdx++) {
      const [kind, payload] = active[sIdx];
      const ctx = {
        setIndex: index,
        setName: setDef.name || `set-${index}`,
        subsetIndex: sIdx,
        subsetsTotal,
      };
      subsetPromises.push(
        loadSubset(kind, payload, conc, callbacks, storeRef, ctx)
      );
    }

    const summaries = await Promise.all(subsetPromises);
    const merged = summaries.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.ok += s.ok;
        acc.failed += s.failed;
        acc.ms = Math.max(acc.ms, s.ms);
        acc.subsets.push(s);
        return acc;
      },
      {
        setIndex: index,
        name: setDef.name || `set-${index}`,
        total: 0,
        ok: 0,
        failed: 0,
        ms: 0,
        subsets: [],
        subsetsTotal,
      }
    );

    callbacks?.onSetComplete?.(merged);
    return merged;
  }

  // ----------------------------- API pública --------------------------------
  const AssetPreloader = {
    /**
     * @param {Array<SetDef>} sets
     * @param {Object} options
     * @param {Object} options.concurrency
     * @param {Function} options.onSetStart
     * @param {Function} options.onSubsetStart
     * @param {Function} options.onSubsetComplete
     * @param {Function} options.onSetComplete
     * @param {Function} options.onAllComplete
     * @param {EventTarget} options.eventsTarget  // (por defecto: document)
     * @returns {Promise<Array<SetSummary>>}
     */
    async start(sets, options = {}) {
      const {
        concurrency = {
          fonts: 4,
          images: 10,
          gifs: 8,
          audio: 6,
          videos: 2,
          videoPortions: 2,
        },
        onSetStart,
        onSubsetStart,
        onSubsetComplete,
        onSetComplete,
        onAllComplete,
        eventsTarget = document,
        isFailedSet = false,
      } = options;

      // Wrappers que emiten eventos + llaman tu callback si existe
      const cbs = {
        onSetStart: (index, set, ctx) => {
          emitEvent(eventsTarget, !isFailedSet ? "assetpreloader:setstart" : "assetpreloader:setstart:failed", {
            index,
            set,
            ctx,
          });
          onSetStart?.(index, set, ctx);
        },
        onSubsetStart: (kind, payload, ctx) => {
          emitEvent(eventsTarget, !isFailedSet ? "assetpreloader:subsetstart" : "assetpreloader:subsetstart:failed", {
            kind,
            total: (payload || []).length,
            ctx,
          });
          onSubsetStart?.(kind, payload, ctx);
        },
        onSubsetComplete: (summary, results) => {
          emitEvent(eventsTarget, !isFailedSet ? "assetpreloader:subsetcomplete" : "assetpreloader:subsetcomplete:failed", {
            summary,
            results,
          });
          onSubsetComplete?.(summary, results);
        },
        onSetComplete: (summary) => {
          emitEvent(eventsTarget, !isFailedSet ? "assetpreloader:setcomplete" : "assetpreloader:setcomplete:failed", summary);
          onSetComplete?.(summary);
        },
        onAllComplete: (all) => {
          emitEvent(eventsTarget, !isFailedSet ? "assetpreloader:allcomplete" : "assetpreloader:allcomplete:failed", {
            results: all,
          });
          onAllComplete?.(all);
        },
      };

      // Preconnect global
      preconnectHosts(uniqueHostsFromSets(sets));

      const results = [];
      for (let i = 0; i < sets.length; i++) {
        results.push(await loadSet(sets[i], i, concurrency, cbs, eventsTarget));
      }
      cbs.onAllComplete(results);
      return results;
    },
  };

  

  // Exponer en window
  window.AssetPreloader = AssetPreloader;

  const mainUrl = "https://raw.githubusercontent.com/ObedCabanzo/public-assets/main/trivia";

  const SETS = [
    {
      name: "boot",
      preconnect: [
        "https://raw.githubusercontent.com",
        "https://braze-images.com",
        "https://dl.dropboxusercontent.com",
      ],
      fonts: [
        { family: "Garage Gothic Bold", url: `${mainUrl}/fonts/in-app-trivia-font-Garage%20Gothic%20Bold.otf`, descriptors: { style: "normal", weight: "700" } },
        { family: "LemonMilk Bold",     url: `${mainUrl}/fonts/in-app-trivia-font-LEMONMILK-Bold.otf`,       descriptors: { style: "normal", weight: "700" } },
      ],
      images: [
        `${mainUrl}/images/Boton_play.png`,
      ],
      gifs: [
        `${mainUrl}/gif/Personajes_X3_Intro.gif`,
        `${mainUrl}/gif/Llama_Intro.gif`,
        `${mainUrl}/gif/Pregunta_Intro_Rojo_Vacio.gif`,
        `${mainUrl}/gif/Llama_Generica.gif`,
        `${mainUrl}/gif/Logo_Armado.gif`,
      ],
      audio: [
        `${mainUrl}/sound/boton.mp3`,
        `${mainUrl}/sound/transicion_1.mp3`,
        `${mainUrl}/sound/Win.mp3`,
        `${mainUrl}/sound/Destello.mp3`,
        `${mainUrl}/sound/Salto_1.mp3`,
        `${mainUrl}/sound/Salto_2.mp3`,
      ],
      videoPortions: [
        { url: "https://dl.dropboxusercontent.com/scl/fi/b0paaqu29vknt85xp0lap/background.mp4?rlkey=9ndjdqoer1ceitmdq5wsmuvum&st=b3y4sjhl&dl=0", portion: 0.25 },
      ],
      concurrency: { images: 12, gifs: 8, audio: 4, fonts: 4, videoPortions: 1 },
    },
    {
      name: "gameplay-core",
      images: [
        `${mainUrl}/gif/Particle_Fireworks.gif`,
        `${mainUrl}/gif/Excelente.gif`,
        `${mainUrl}/gif/Incorrecto.gif`,
      ],
      gifs: [
        `${mainUrl}/gif/Personajes_X3_Bucle.gif`,
        `${mainUrl}/gif/Pregunta_Cierre_Rojo_Vacio.gif`,
      ],
      audio: [
        `${mainUrl}/images/flame_sad.png`, /* (verifica: esto parece imagen en 'audio') */
        `${mainUrl}/sound/Choque.mp3`,
        `${mainUrl}/sound/Crocantitow.mp3`,
        `${mainUrl}/sound/Derratidow.mp3`,
        `${mainUrl}/sound/GameOver_1.mp3`,
        `${mainUrl}/sound/GameOver_2.mp3`,
        `${mainUrl}/sound/Musica_Bucle.mp3`,
        `${mainUrl}/sound/Musica_Bucle2.mp3`,
        `${mainUrl}/sound/Paso_Dch.mp3`,
        `${mainUrl}/sound/Paso_Izq.mp3`,
        `${mainUrl}/sound/Timer.mp3`,
        `${mainUrl}/sound/Timer12.mp3`,
        `${mainUrl}/sound/transicion_2.mp3`,
      ],
    },
    {
      name: "win-lose-and-streak",
      gifs: [
        `${mainUrl}/gif/CompletaLaRacha.gif`,
        `${mainUrl}/gif/CompletasteLaRacha.gif`,
        `${mainUrl}/gif/Ganaste_Encuesta_Cupon.gif`,
        `${mainUrl}/gif/Pierde_Cupon30.gif`,
        `${mainUrl}/gif/Up_tiempo.gif`,
        `${mainUrl}/gif/Cupon_Brisket_10_sinboton.gif`,
        `${mainUrl}/gif/Cupon_Brisket_20_sinboton.gif`,
        `${mainUrl}/gif/Cupon_Brisket_Gratis_sinboton.gif`,
        `${mainUrl}/gif/Cupon_Completos_40_sinboton.gif`,
        `${mainUrl}/gif/Boton_PideAqui.gif`,
      ],
    },
  ];

  // Expón el total para que la UI muestre (1/3), (2/3)...
  window.__SETS_LENGTH__ = SETS.length;

  const logCallbacks = {
    onSetStart: (i, set, ctx) => console.log(`▶️ Set ${i} "${set.name}" START (${ctx.subsetsTotal} subsets)`),
    onSubsetStart: (kind, payload, ctx) => console.log(`   ⏳ ${kind} ${ctx.subsetIndex+1}/${ctx.subsetsTotal} (${(payload||[]).length} items)`),
    onSubsetComplete: (summary) => console.log(`   ✅ ${summary.kind} ok:${summary.ok}/${summary.total}`),
    onSetComplete: (summary) => console.log(`✔️ Set "${summary.name}" COMPLETO (subsets:${summary.subsetsTotal})`),
    onAllComplete: () => console.log(`🏁 TODOS LOS SETS COMPLETOS`),
  };

  window.AssetPreloader.start(SETS, {
    concurrency: { fonts: 4, images: 10, gifs: 8, audio: 6, videos: 2, videoPortions: 2 },
    ...logCallbacks,
  });
})();