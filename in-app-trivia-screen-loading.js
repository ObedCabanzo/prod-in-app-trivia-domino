(function (global) {
  "use strict";

  const brazeBridge = global.brazeBridge;

  const { updateClasses, delay } = global.App.utils;
  const cfg = (global.App.config = global.App.config || {});

  // ======================= Estado local =======================
  let setLoading = 0;
  let progress = 0; // 0..100
  let messageIntervalId = null;
  let retryIntervalId = null;
  let lastMessageIndex = 0;
  const OFFLINE_MSG = "Parece que no tienes conexión a internet";

  // URL para pings (mismo origen por defecto)
  // Puedes sobreescribirla en runtime con: App.loadingScreen.setPingURL('/healthz')
  let pingURL = cfg.pingURL || "/favicon.ico";

  const messages = [
    "No cierres la app, estamos ajustando los últimos detalles del reto",
    "Cargando animaciones y sonidos para que disfrutes al máximo",
    "Armando las preguntas… prepárate para ganar",
    "Sincronizando premios y sorpresas…",
  ];

  // ======================= DOM refs =======================
  const fill = document.getElementById("progress-fill");
  const progressBar = document.getElementById("progress-bar");
  const loadingText = document.getElementById("loading-text");
  const loadingButton = document.getElementById("loading-button");
  const tooMuchDelayAbortBtn = document.getElementById(
    "too-much-delay-abandon-btn"
  );

  const offlineOverlay = document.getElementById("offline-overlay");
  const offlineRetryBtn = document.getElementById("offline-retry");
  const offlineAbortBtn = document.getElementById("offline-abort");



  // ======================= Utilidades UI =======================
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  const updateProgress = (pct) => {
    progress = clamp(pct, 0, 100);
    if (fill) fill.style.width = `${progress}%`;
  };

  function startMessageRotation() {
    if (messageIntervalId) return;
    messageIntervalId = setInterval(async () => {
      if (!loadingText) return;
      updateClasses([{ element: loadingText, add: "opacity-0" }]);
      await delay(250);
      // Mensaje aleatorio distinto al anterior (si se puede)
      let next = Math.floor(Math.random() * messages.length);
      if (messages.length > 1 && next === lastMessageIndex) {
        next = (next + 1) % messages.length;
      }
      lastMessageIndex = next;
      loadingText.textContent = messages[lastMessageIndex];
      updateClasses([{ element: loadingText, remove: "opacity-0" }]);
    }, 5000);
  }

  function stopMessageRotation() {
    if (messageIntervalId) {
      clearInterval(messageIntervalId);
      messageIntervalId = null;
    }
  }

  function showOfflineUI() {
    // Oculta progreso y cualquier botón anterior
    updateClasses([
      { element: progressBar, add: "hidden" },
      { element: loadingButton, add: ["hidden", "opacity-0"] },
      { element: offlineOverlay, remove: "hidden" },
    ]);
    // Fija el texto a mensaje offline y detiene rotación
    stopMessageRotation();
    if (loadingText) loadingText.textContent = OFFLINE_MSG;
    // Evento para que el host pueda escuchar
    document.dispatchEvent(new CustomEvent("loadingscreen:offline"));
  }

  function hideOfflineUI() {
    updateClasses([
      { element: offlineOverlay, add: "hidden" },
      { element: progressBar, remove: "hidden" },
    ]);
    // Retoma rotación de mensajes
    startMessageRotation();
    document.dispatchEvent(new CustomEvent("loadingscreen:online"));
  }

  // ======================= Conectividad =======================
  async function hasConnectivity() {
    // Intento de HEAD sin caché; si falla, asumimos sin conexión
    try {
      const url = `${pingURL}${
        pingURL.includes("?") ? "&" : "?"
      }t=${Date.now()}`;
      // Preferimos HEAD; algunos orígenes pueden no soportarlo -> fallback a GET
      let res;
      try {
        res = await fetch(url, { method: "HEAD", cache: "no-store" });
      } catch (_) {
        res = await fetch(url, { method: "GET", cache: "no-store" });
      }
      // Si llega aquí sin lanzar es suficiente para considerar "online"
      return true;
    } catch {
      return false;
    }
  }

  async function attemptReconnect() {
    const ok = await hasConnectivity();
    if (ok) {handleOnline()}
    else {handleOffline()};
  }

  function startAutoRetry() {
    stopAutoRetry();
    retryIntervalId = setInterval(attemptReconnect, 2500);
  }

  function stopAutoRetry() {
    if (retryIntervalId) {
      clearInterval(retryIntervalId);
      retryIntervalId = null;
    }
  }

   function handleOffline() {
    showLoadingScreen();
    showOfflineUI();
    startAutoRetry();
  }

  function handleOnline() {
    hideLoadingScreen();
    stopAutoRetry();
    hideOfflineUI();
  }

  // Escuchamos eventos nativos
  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  // ======================= Eventos del preloader =======================
  document.addEventListener("assetpreloader:subsetcomplete", () => {
    updateProgress(progress + 20);
  });

  document.addEventListener("assetpreloader:setcomplete", () => {
    updateProgress(100);
    console.log("All assets preloaded:", setLoading);
    hideLoadingScreen();
  });

  document.addEventListener("assetpreloader:setStart", (event) => {
    setLoading = event.detail.setIndex;
    updateProgress(0);
  });

  document.addEventListener("assetpreloader:setstart:failed", (e) => {
    updateProgress(0);
    showLoadingScreen();
  });
  document.addEventListener("assetpreloader:subsetstart:failed", (e) => {
    console.log(
      "[RETRY] ⏳ failed_subsetstart:",
      e.detail?.kind,
      e.detail?.ctx
    );
  });
  document.addEventListener("assetpreloader:subsetcomplete:failed", (e) => {
    updateProgress(progress + 20);
  });
  document.addEventListener("assetpreloader:setcomplete:failed", (e) => {
    updateProgress(100);
    hideLoadingScreen();
  });

  // Si tu preloader emite progreso granular 0..100
  document.addEventListener("setprogress", (event) => {
    const { progress: pct } = event.detail || {};
    if (typeof pct === "number") updateProgress(pct);
  });

  // ======================= Botón “se está tardando” =======================
  delay(15000).then(async () => {
    if (!loadingButton) return;
    updateClasses([{ element: loadingButton, remove: ["hidden"] }]);
    await delay(500);
    updateClasses([{ element: loadingButton, remove: ["opacity-0"] }]);
  });

  // ======================= Offline overlay: botones =======================
  if (offlineRetryBtn) {
    offlineRetryBtn.addEventListener("click", attemptReconnect);
  }


  // ======================= API pública =======================
  const showLoadingScreen = async () => {
    updateClasses([{ element: "#loading-screen", remove: "hidden" }]);
    await delay(1100);
    updateClasses([{ element: "#loading-screen", remove: "opacity-0" }]);
    delay(15000).then(async () => {
      updateClasses([{ element: loadingButton, remove: "hidden" }]);
      await delay(500);
      updateClasses([{ element: loadingButton, remove: "opacity-0" }]);
    });
  };

  const hideLoadingScreen = async () => {
    updateClasses([{ element: "#loading-screen", add: "opacity-0" }]);
    await delay(1100);
    updateClasses([{ element: "#loading-screen", add: "hidden" }]);
    updateClasses([
      { element: loadingButton, add: "hidden", opacity: "opacity-0" },
    ]);
  };

  function setPingURL(url) {
    pingURL = url;
  }

  global.App.loadingScreen = Object.assign(global.App.loadingScreen || {}, {
    showLoadingScreen,
    hideLoadingScreen,
    setPingURL,
    // opcional: define un callback para “Abandonar reto”
    onAbort: null,
  });

  // ======================= Arranque =======================
  // Inicia la rotación normal
  startMessageRotation();
  // Si ya entramos sin conexión, mostrar overlay de inmediato
  if (navigator && "onLine" in navigator && !navigator.onLine) {
    handleOffline();
  }
})(window);
