(function (global) {
  const { flameGifContainer } = global.App.references || {};
  const mainUrl =
    "https://raw.githubusercontent.com/ObedCabanzo/public-assets/main/trivia";

  // Utilidad: cambia clases; acepta selector CSS o nodo(s)
  function updateClasses(actions = []) {
    // Normaliza "remove"/"add" a una lista de clases
    const toList = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v.flatMap(toList); // aplanar arrays anidados
      if (typeof v === "string") return v.trim().split(/\s+/); // permite "a b c"
      return [];
    };

    // Normaliza "element" a una lista de nodos
    const collectTargets = (element) => {
      if (!element) return [];
      if (typeof element === "string") {
        let nodes = Array.from(document.querySelectorAll(element));
        if (
          nodes.length === 0 &&
          !element.startsWith("#") &&
          !element.startsWith(".")
        ) {
          const byId = document.getElementById(element);
          if (byId) nodes = [byId];
        }
        return nodes;
      }
      if (element instanceof Node) return [element];
      if (typeof element.length === "number") {
        return Array.from(element).flatMap(collectTargets); // acepta NodeList, Array, incluso anidados
      }
      return [];
    };

    actions.forEach(({ element, remove, add }) => {
      const targets = collectTargets(element);
      const removes = toList(remove);
      const adds = toList(add);

      targets.forEach((el) => {
        if (removes.length) el.classList.remove(...removes);
        if (adds.length) el.classList.add(...adds);
      });
    });
  }

  let totalTranslateX = 0;
  let totalTranslateY = 0;

  /**
   * FUNCIÓN CORREGIDA: Mueve un elemento al centro de otro.
   * Ahora calcula el desplazamiento necesario desde la posición actual y lo
   * suma a la traslación total acumulada.
   * @param {HTMLElement} sourceEl - El elemento que se va a mover.
   * @param {HTMLElement} targetEl - El elemento sobre el cual se centrará.
   */
  function centerElementOn(sourceEl, targetEl, scale = 1) {
    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const newLeft = targetCenterX - sourceRect.width / 2;
    const newTop = targetCenterY - sourceRect.height / 2;

    const deltaX = newLeft - sourceRect.left;
    const deltaY = newTop - sourceRect.top;

    totalTranslateX += deltaX;
    totalTranslateY += deltaY;

    sourceEl.style.transform = `translate(${totalTranslateX}px, ${totalTranslateY}px) scale(${scale})`;
  }

  let screen = 0;

  function incScreen() {
    screen++;
    return screen;
  }

  function getScreen() {
    return screen;
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Devuelve una lista de objetos por mes dentro del rango [startDate, endDate] (inclusive).
   * month en inglés y minúsculas; start/end son días del mes.
   * Usa UTC para evitar desfaces por zona horaria.
   *
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {{month:string,start:number,end:number}[]}
   */
  function monthSlices(startDate, endDate) {
    if (!(startDate instanceof Date) || isNaN(startDate)) {
      throw new TypeError("startDate must be a valid Date");
    }
    if (!(endDate instanceof Date) || isNaN(endDate)) {
      throw new TypeError("endDate must be a valid Date");
    }

    // Asegura orden
    let s = startDate,
      e = endDate;
    if (s > e) [s, e] = [e, s];

    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    const result = [];
    let y = s.getUTCFullYear();
    let m = s.getUTCMonth();
    const endY = e.getUTCFullYear();
    const endM = e.getUTCMonth();

    const sDay = s.getUTCDate();
    const eDay = e.getUTCDate();

    while (y < endY || (y === endY && m <= endM)) {
      const firstDay =
        y === s.getUTCFullYear() && m === s.getUTCMonth() ? sDay : 1;
      const lastDayOfThisMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const lastDay = y === endY && m === endM ? eDay : lastDayOfThisMonth;

      result.push({ month: monthNames[m], start: firstDay, end: lastDay });

      // Avanza al siguiente mes
      m++;
      if (m === 12) {
        m = 0;
        y++;
      }
    }

    return result;
  }

  /**
   * Observa un elemento (img o video) y ejecuta un callback cuando esté listo.
   * Si ya está cargado, ejecuta el callback inmediatamente.
   *
   * @param {HTMLElement} element - Elemento a observar (img o video).
   * @param {Function} onReady - Función a ejecutar cuando el elemento esté listo.
   */
  function onElementReady(element, onReady) {
    if (!element) {
      console.warn("Elemento no encontrado.");
      return;
    }

    const execOnce = () => {
      onReady();
    };

    if (element.tagName === "IMG") {
      // Imagen: si ya está cargada (por caché), ejecutar inmediatamente
      if (element.complete && element.naturalWidth > 0) {
        execOnce();
      } else {
        element.addEventListener("load", execOnce, { once: true });
        element.addEventListener("error", (e) =>
          console.error("Error al cargar la imagen:", e)
        );
      }
    } else if (element.tagName === "VIDEO") {
      // Video: usar loadeddata para saber que tiene frames listos
      if (element.readyState >= 2) {
        execOnce();
      } else {
        element.addEventListener("loadeddata", execOnce, { once: true });
        element.addEventListener("error", (e) =>
          console.error("Error al cargar el video:", e)
        );
      }
    } else {
      // Fallback: ejecutar al siguiente ciclo
      queueMicrotask(execOnce);
    }
  }

  function executeAnimation(
    event,
    animationClass,
    element,
    delayTime = 0,
    callback
  ) {
    element.addEventListener(event, () => {
      element.classList.add(animationClass);
      void element.offsetWidth;
      delayTime
        ? delay(delayTime).then(() => {
            element.classList.remove(animationClass);
          })
        : element.classList.remove(animationClass);
      if (callback) callback();
    });
  }

  // Reutilizable: genera el mapa en filas de 5
  async function generateMap() {
    startDate = new Date(global.App.metadata.config.initialDate);
    endDate = new Date(global.App.metadata.config.finalDate);
    console.log("Generating map from", startDate, "to", endDate);

    const mapContainer = document.getElementById("map-container");
    const months = monthSlices(startDate, endDate);

    // For each month in startDate and endDate generate an object for month with the initial and end date of each month
    for (const month of months) {
      console.log("Generating month:", month);
      const monthEl =
        document.getElementById(`map-container-${month.month}`) ||
        document.createElement("div");
      monthEl.id = `map-container-${month.month}`;
      monthEl.classList.add(
        "flex",
        "flex-col",
        "justify-center",
        "items-center",
        "gap-2"
      );
      mapContainer.appendChild(monthEl);

      // Normaliza el rango (inclusive)
      let s = Number(month.start),
        e = Number(month.end);
      if (Number.isNaN(s) || Number.isNaN(e)) return;
      if (s > e) [s, e] = [e, s];

      const totalDays = e - s + 1;

      // Limpia el contenedor por si se vuelve a llamar
      monthEl.innerHTML = "";

      const ROW_SIZE = 5;
      let created = 0;

      const titleDiv = document.createElement("div");
      const title = document.createElement("h1");
      title.classList.add("map-title");
      console.log("Month:", month.month);
      if (month.month === "september") {
        title.textContent = "Septiembre";
      }
      if (month.month === "october") {
        title.textContent = "Octubre";
      }

      titleDiv.appendChild(title);
      monthEl.appendChild(titleDiv);
      while (created < totalDays) {
        const row = document.createElement("div");
        row.classList.add("map-row");

        for (let j = 0; j < ROW_SIZE && created < totalDays; j++) {
          const dayNumber = s + created;

          const unit = document.createElement("div");
          unit.classList.add("map-unit");
          unit.id = `map-unit-${month}-${dayNumber}`;

          const img = document.createElement("img");
          img.src = mainUrl + "/images/map_unit.png";
          img.alt = `Día ${dayNumber}`;
          img.classList.add("map-unit-img");

          const label = document.createElement("h1");
          label.classList.add("map-day");
          label.textContent = dayNumber;

          unit.appendChild(img);
          unit.appendChild(label);
          row.appendChild(unit);
          created++;
        }

        monthEl.appendChild(row);
      }
    }
  }

  /**
   * Mueve (reparenta) un elemento a otro contenedor con animación.
   * mode: 'translate' (default) -> vuela con FLIP / View Transitions
   * mode: 'reappear'            -> desaparece y reaparece (fade out/in)
   *
   * @param {Element|string} node
   * @param {Element|string} newParent
   * @param {Object} opt
   * @param {'translate'|'reappear'} [opt.mode='translate']
   * @param {number} [opt.duration=400]     Duración total (ms)
   * @param {string} [opt.easing='cubic-bezier(.22,.61,.36,1)']
   * @param {Element} [opt.before]          Insertar antes de este hijo del destino
   * @param {boolean} [opt.scale=true]      En 'translate': anima tamaño; en 'reappear': usa un pequeño scale
   * @param {boolean} [opt.placeholder=true] Mantiene el hueco en el origen durante la animación
   * @param {number} [opt.gap=0]            En 'reappear': pausa (ms) entre desaparecer y aparecer
   * @param {number} [opt.fadeOutScale=0.98] En 'reappear': escala al desvanecer
   * @param {number} [opt.fadeInScale=1.02]  En 'reappear': escala al aparecer
   */
  async function moveSmooth(node, newParent, opt = {}) {
    const el = typeof node === "string" ? document.querySelector(node) : node;
    const target =
      typeof newParent === "string"
        ? document.querySelector(newParent)
        : newParent;
    if (!el || !target) throw new Error("Elemento o destino no encontrado");

    const {
      mode = "translate",
      duration = 400,
      easing = "cubic-bezier(.22,.61,.36,1)",
      before = null,
      scale = true,
      placeholder = true,
      gap = 0,
      fadeOutScale = 0.98,
      fadeInScale = 1.02,
    } = opt;

    const prefersReduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const insert = () => {
      if (before && target.contains(before)) target.insertBefore(el, before);
      else target.appendChild(el);
    };

    if (prefersReduce) {
      insert();
      return;
    }

    // PLACEHOLDER (para ambos modos, evita salto de layout en el origen)
    const firstRect = el.getBoundingClientRect();
    let ph;
    if (placeholder) {
      ph = document.createElement(el.tagName);
      ph.style.width = firstRect.width + "px";
      ph.style.height = firstRect.height + "px";
      ph.style.visibility = "hidden";
      el.parentNode?.insertBefore(ph, el.nextSibling);
    }

    // --- modo REAPPEAR: fade out -> reparent -> (gap) -> fade in ---
    if (mode === "reappear") {
      const prevTransform =
        getComputedStyle(el).transform === "none"
          ? ""
          : getComputedStyle(el).transform;

      // Fade out en origen
      el.style.willChange = "opacity, transform";
      let outKeyframes = [{ opacity: 1, transform: prevTransform || "none" }];
      if (scale)
        outKeyframes.push({
          opacity: 0,
          transform: `scale(${fadeOutScale}) ${prevTransform}`.trim(),
        });
      else
        outKeyframes.push({ opacity: 0, transform: prevTransform || "none" });

      const out = el.animate(outKeyframes, {
        duration: Math.max(1, duration / 2),
        easing,
        fill: "forwards",
      });
      try {
        await out.finished;
      } catch {}

      // Reparent
      insert();

      // Gap opcional
      if (gap > 0) await new Promise((r) => setTimeout(r, gap));

      // Asegurar estado inicial invisible en el nuevo contenedor
      el.style.opacity = "0";

      // Fade in en destino
      let inKeyframes = [];
      if (scale)
        inKeyframes.push({
          opacity: 0,
          transform: `scale(${fadeInScale}) ${prevTransform}`.trim(),
        });
      else inKeyframes.push({ opacity: 0, transform: prevTransform || "none" });
      inKeyframes.push({ opacity: 1, transform: prevTransform || "none" });

      const inn = el.animate(inKeyframes, {
        duration: Math.max(1, duration / 2),
        easing,
        fill: "forwards",
      });
      try {
        await inn.finished;
      } catch {}

      // Limpieza
      el.style.removeProperty("opacity");
      if (prevTransform) el.style.transform = prevTransform;
      else el.style.removeProperty("transform");
      el.style.removeProperty("will-change");
      if (ph) ph.remove();
      return;
    }

    // --- modo TRANSLATE: View Transitions si hay soporte; si no, FLIP ---
    if (document.startViewTransition) {
      if (!el.style.viewTransitionName) {
        el.style.viewTransitionName =
          "mv-" + Math.random().toString(36).slice(2);
      }
      const vt = document.startViewTransition(insert);
      try {
        await vt.finished;
      } catch {}
      if (ph) ph.remove();
      return;
    }

    // FLIP
    const firstStyle = getComputedStyle(el);
    const prevTransform =
      firstStyle.transform === "none" ? "" : firstStyle.transform;

    // Reparent
    insert();

    // LAST
    const lastRect = el.getBoundingClientRect();
    const dx = firstRect.left - lastRect.left;
    const dy = firstRect.top - lastRect.top;
    const sx = scale ? firstRect.width / lastRect.width : 1;
    const sy = scale ? firstRect.height / lastRect.height : 1;

    // PLAY
    el.style.willChange = "transform";
    el.style.transformOrigin = "top left";
    const fromTransform =
      `translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) ${prevTransform}`.trim();
    const toTransform = prevTransform || "none";

    const anim = el.animate(
      [{ transform: fromTransform }, { transform: toTransform }],
      { duration, easing, fill: "both" }
    );

    try {
      await anim.finished;
    } catch {
    } finally {
      anim.cancel();
      if (prevTransform) el.style.transform = prevTransform;
      else el.style.removeProperty("transform");
      el.style.removeProperty("will-change");
      if (ph) ph.remove();
    }
  }

  // Espera a que el contenedor deje de recibir cambios por un pequeño lapso
  function waitForAppendIdle(containerEl, quietMs = 40) {
    return new Promise((resolve) => {
      let timer;
      const done = () => {
        observer.disconnect();
        resolve();
      };
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(done, quietMs);
      });
      observer.observe(containerEl, { childList: true, subtree: true });

      // Si ya tiene hijos, arranca un temporizador corto igualmente
      if (containerEl.children.length) {
        timer = setTimeout(done, quietMs);
      }
    });
  }

  // Anima el grid: filas de arriba a abajo, y dentro de cada fila de derecha a izquierda
  function animateMapAppearance(
    containerEl,
    {
      perItemDelay = 90, // ms entre elementos
      duration = 420, // ms de cada animación
      easing = "ease-out",
      fromScale = 0.6,
    } = {}
  ) {
    const rows = Array.from(containerEl.querySelectorAll(".map-row"));
    let index = 0;

    rows.forEach((row) => {
      const unitsRTL = Array.from(row.querySelectorAll(".map-unit")).reverse();
      unitsRTL.forEach((unit) => {
        // Web Animations API: no necesitas CSS extra
        unit.animate(
          [
            { opacity: 0, transform: `scale(${fromScale})` },
            { opacity: 1, transform: "scale(1)" },
          ],
          {
            duration,
            easing,
            delay: index * perItemDelay,
            fill: "forwards", // conserva el estado final
          }
        );
        index++;
      });
    });
  }

  async function animateMapEntrance(
    interval = 100,
    animateBoth = false,
    overlapAfter = 2,
    streakDays = null,
    flameOptions = {}
  ) {
    const oct = document.getElementById("map-container-october");
    const sep = document.getElementById("map-container-september");

    const animateContainer = (container) => {
      if (!container) return Promise.resolve();

      const title = container.querySelector("div h1, h1.map-title");

      const rows = Array.from(container.querySelectorAll(".map-row"));
      let maxIndex = 0;

      rows.forEach((row, rIdx) => {
        if (rIdx === 0) {
          if (title) title.classList.add("visible");
          animateLettersGrow(title);
        }
        row.classList.add("visible");
        const units = Array.from(row.querySelectorAll(".map-unit")); // ¡ojo: dentro de la fila!
        units.forEach((unit, uIdx) => {
          const index = rIdx * overlapAfter + uIdx; // stagger diagonal con solape
          const delayMs = interval * index;
          if (index > maxIndex) maxIndex = index;
          setTimeout(() => unit.classList.add("visible"), delayMs);
        });
      });

      const totalMs = interval * (maxIndex + 1);
      return new Promise((resolve) => setTimeout(resolve, totalMs));
    };

    if (animateBoth) {
      await Promise.all([animateContainer(oct)]);
    } else {
      await animateContainer(sep);
      await animateContainer(oct);
    }
    await runStreakTraversal(flameOptions);
  }

  // Recorre el flame por los días (unidades) y pinta el estado de cada día
  async function runStreakTraversal({
    duration = 100, // duración del movimiento entre unidades
    pause = 200, // pausa tras posicionarse sobre una unidad
    screenClass = "screen-2-3", // clase que agregas al flame (como en tu ejemplo)
    addJump = true, // si quieres añadir la clase "jump" al flame
    reset = true, // limpia clases previas (active/strake-*)
  } = {}) {
    // Elemento flame
    updateClasses([{ element: flameGifContainer, add: "screen-2-2" }]);

    // Unidades en orden: primero septiembre, luego octubre (ajústalo si tu DOM cambia)
    const allUnits = Array.from(
      document.querySelectorAll("#map-container-october .map-unit")
    );
    const streakDays = global.App.metadata.streakDays || "";
    const finished = global.App.metadata.user.finished || false;
    let stop = false;
    console.log("Streak days:", streakDays, "Finished:", finished);

    let count = 1;
    for (const mapUnit of allUnits) {
      const mapUnitImg = mapUnit.querySelector(".map-unit-img");
      const isFirst = count % 5 === 0;

      updateClasses([
        {
          element: flameGifContainer,
          add: "jump",
        },
        {
          element: mapUnitImg,
          add: "active",
        },
      ]);
      if (isFirst) {
        scrollToChild("#map-container", mapUnit);
      }
      if (count === 1) {
        global.SoundAPI.play("salto2");
      } else {
        global.SoundAPI.play("salto1");
      }
      await moveSmooth(flameGifContainer, mapUnit, { mode: "translate" });

      if (count === global.App.metadata.config.daysPassed || stop) {
        if (finished && !stop) {
          stop = true;
        } else {
          break;
        }
      }
      updateClasses([
        {
          element: mapUnitImg,
          add: streakDays[count - 1] === "1" ? "strake-win" : "strake-lost",
          remove: streakDays.length !== count ? "active" : "",
        },
      ]);

      count++;
    }
  }

  function scrollToChild(
    container,
    child,
    {
      align = "start", // 'start' | 'center' | 'end' | 'nearest'
      behavior = "smooth", // 'auto' | 'smooth'
      offset = 0, // píxeles extra (+ baja, - sube)
    } = {}
  ) {
    const c =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    const el = typeof child === "string" ? c.querySelector(child) : child;
    if (!c || !el) return;

    const cRect = c.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();

    const topInContainer = eRect.top - cRect.top + c.scrollTop;
    const leftInContainer = eRect.left - cRect.left + c.scrollLeft;

    let targetTop = topInContainer;
    let targetLeft = leftInContainer;

    if (align === "center") {
      targetTop = topInContainer - (c.clientHeight - el.clientHeight) / 2;
      targetLeft = leftInContainer - (c.clientWidth - el.clientWidth) / 2;
    } else if (align === "end") {
      targetTop = topInContainer - (c.clientHeight - el.clientHeight);
      targetLeft = leftInContainer - (c.clientWidth - el.clientWidth);
    } else if (align === "nearest") {
      targetTop = Math.max(
        Math.min(
          topInContainer,
          c.scrollTop + c.clientHeight - el.clientHeight
        ),
        c.scrollTop
      );
      targetLeft = Math.max(
        Math.min(
          leftInContainer,
          c.scrollLeft + c.clientWidth - el.clientWidth
        ),
        c.scrollLeft
      );
    }

    c.scrollTo({ top: targetTop + offset, left: targetLeft, behavior });
  }

  // function for restarting gif
  async function restartGif(target) {
    const el = typeof target === "string" ? document.getElementById(target) : target;
    // Get image parent 
    const src = el.src;
     const separator = src.includes('?') ? '&' : '?';
     el.src = src + separator + '_t=' + Date.now();

  }

  /**
   * Anima letra por letra con stagger.
   * Efectos:
   *  - 'grow'           : escala tipo pop (default)
   *  - 'fade-up'        : aparece haciendo fade-in desde abajo
   *  - 'grow-fade-up'   : combina escala + subida + fade
   *
   * @param {string|HTMLElement} target - Selector o nodo del título.
   * @param {Object} options
   * @param {number}   [options.stagger=70]          - ms entre letras.
   * @param {number}   [options.duration=420]        - ms de cada letra.
   * @param {number}   [options.fromScale=0.2]       - escala inicial (0–1).
   * @param {number}   [options.fromY=14]            - px de desplazamiento vertical inicial (para los efectos *-fade-up).
   * @param {string}   [options.easing='cubic-bezier(.2,.8,.2,1)']
   * @param {string}   [options.origin='center']     - transform-origin.
   * @param {boolean}  [options.startOnVisible=false]- dispara al entrar en viewport.
   * @param {'grow'|'fade-up'|'grow-fade-up'} [options.effect='grow']
   * @param {number}   [options.threshold=0.2]       - umbral de visibilidad para IntersectionObserver.
   * @param {boolean}  [options.useBlur=true]        - si aplica blur en el arranque (grow / grow-fade-up).
   */

  function animateLettersGrow(
    target,
    {
      stagger = 70,
      duration = 420,
      fromScale = 0.2,
      fromY = 14,
      easing = "cubic-bezier(.2,.8,.2,1)",
      origin = "center",
      startOnVisible = false,
      effect = "grow",
      threshold = 0.2,
      useBlur = true,
    } = {}
  ) {
    const el =
      typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Inyecta keyframes una vez
    const KEY_ID = "letter-anim-keyframes";
    if (!document.getElementById(KEY_ID)) {
      const style = document.createElement("style");
      style.id = KEY_ID;
      style.textContent = `
@keyframes letter-grow-pop {
  0%   { transform: scale(var(--from-scale,0.2)); opacity: 0; filter: var(--start-blur, none); }
  60%  { transform: scale(1.08);                 opacity: 1; filter: none; }
  100% { transform: scale(1); }
}
@keyframes letter-fade-up {
  0%   { transform: translateY(var(--from-y, 14px)); opacity: 0; }
  100% { transform: translateY(0);                  opacity: 1; }
}
@keyframes letter-grow-fade-up {
  0%   { transform: translateY(var(--from-y,14px)) scale(var(--from-scale,0.2)); opacity:0; filter: var(--start-blur, none); }
  60%  { transform: translateY(0) scale(1.08);                               opacity:1; filter: none; }
  100% { transform: translateY(0) scale(1);                                   }
}
.letter-piece { display:inline-block; will-change: transform, opacity, filter; }
.letter-word  { display:inline-block; white-space: nowrap; } /* <-- evita cortes dentro de la palabra */
`;
      document.head.appendChild(style);
    }

    const originalText = el.textContent || "";
    el.setAttribute("aria-label", originalText);
    el.innerHTML = "";

    const kfName =
      effect === "fade-up"
        ? "letter-fade-up"
        : effect === "grow-fade-up"
        ? "letter-grow-fade-up"
        : "letter-grow-pop";

    // Divide en tokens: palabras y separadores (espacios, tabs, saltos)
    const tokens = originalText.split(/(\s+)/);
    const spans = []; // todas las letras (para controlar play/pause/replay)

    tokens.forEach((tok) => {
      if (/^\s+$/.test(tok)) {
        // Espacios/saltos como texto normal -> el navegador puede partir aquí
        el.appendChild(document.createTextNode(tok));
        return;
      }

      // Contenedor por palabra (evita quiebres internos)
      const w = document.createElement("span");
      w.className = "letter-word";

      // Para cada letra de la palabra
      Array.from(tok).forEach((ch) => {
        const s = document.createElement("span");
        s.className = "letter-piece";
        s.textContent = ch;

        // Variables/CSS
        s.style.setProperty("--from-scale", String(fromScale));
        s.style.setProperty("--from-y", `${fromY}px`);
        s.style.setProperty("--start-blur", useBlur ? "blur(2px)" : "none");
        s.style.transformOrigin = origin;

        // Timing
        const effDuration = reduceMotion ? 1 : duration;
        const effDelay = reduceMotion ? 0 : spans.length * stagger;

        s.style.animation = `${kfName} ${effDuration}ms ${easing} both`;
        s.style.animationDelay = `${effDelay}ms`;
        if (startOnVisible && !reduceMotion)
          s.style.animationPlayState = "paused";

        w.appendChild(s);
        spans.push(s);
      });

      el.appendChild(w);
    });

    // Start-on-visible
    let observer;
    if (startOnVisible && !reduceMotion && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              spans.forEach((s) => (s.style.animationPlayState = "running"));
              observer.disconnect();
            }
          });
        },
        { threshold }
      );
      observer.observe(el);
    }

    // Reaplica animación (p. ej. en replay)
    function applyAnimation() {
      spans.forEach((s, i) => {
        s.style.animation = "none";
        // fuerza reflow
        // eslint-disable-next-line no-unused-expressions
        s.offsetWidth;
        s.style.animation = `${kfName} ${duration}ms ${easing} both`;
        s.style.animationDelay = `${i * stagger}ms`;
        s.style.animationPlayState = "running";
      });
    }

    return {
      replay() {
        if (reduceMotion) return;
        applyAnimation();
      },
      pause() {
        spans.forEach((s) => (s.style.animationPlayState = "paused"));
      },
      play() {
        spans.forEach((s) => (s.style.animationPlayState = "running"));
      },
      destroy() {
        if (observer) observer.disconnect();
        el.textContent = originalText;
      },
    };
  }

  /**
   * Calcula el número de días entre dos fechas (incluyendo inicio y fin).
   * @param {string|Date} startDate - Fecha inicial (string o Date).
   * @param {string|Date} endDate - Fecha final (string o Date).
   * @returns {number} - Número de días (mínimo 1).
   */
  function daysBetweenInclusive(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalizar para ignorar horas/minutos/segundos
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - start;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays >= 0 ? diffDays + 1 : diffDays - 1;
  }

  async function appendGifWithFinalImage(
    parentContainer,
    gifUrl,
    finalImageUrl,
    delayTime,
    classList = [],
    containerId = "gif-container-result"
  ) {
    console.log("Appending gif with final image to", parentContainer);
    if (!parentContainer) return;

    const container = document.createElement("div");
    container.id = containerId;
    container.innerHTML = ""; // Limpia contenido previo
    container.classList.add(...classList);
    parentContainer.appendChild(container);

    const gif = document.createElement("img");
    gif.src = gifUrl;
    gif.alt = "Animation";
    gif.style.width = "auto";
    gif.style.height = "100%";
    gif.style.position = "absolute";
    gif.style.display = "block";

    const finalImg = document.createElement("img");
    finalImg.src = finalImageUrl;
    finalImg.alt = "Final Image";
    finalImg.style.display = "none"; // Oculta inicialmente
    finalImg.style.width = "auto";
    finalImg.style.height = "100%";
    finalImg.style.position = "absolute";

    container.appendChild(gif);
    container.appendChild(finalImg);
    await delay(delayTime).then(() => {
      gif.style.display = "none";
      finalImg.style.display = "block";
    });
  }

  global.App = global.App || {};
  global.App.utils = Object.assign(global.App.utils || {}, {
    updateClasses,
    centerElementOn,
    incScreen,
    getScreen,
    delay,
    onElementReady,
    executeAnimation,
    generateMap,
    waitForAppendIdle,
    animateMapAppearance,
    animateMapEntrance,
    runStreakTraversal,
    scrollToChild,
    restartGif,
    animateLettersGrow,
    moveSmooth,
    daysBetweenInclusive,
    appendGifWithFinalImage,
  });

  global.dispatchEvent(new Event("utils:ready"));
})(window);
