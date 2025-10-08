(function (global) {
  if (!global.App) global.App = {};
  const App = global.App;
  const { delay } = global.App.utils;

  // Registro simple de "screens"
  App.screens = App.screens || {};
  App.registerScreen = function (name, api) {
    App.screens[name] = api;
  };

  // Arranque de la app (se llama desde wiring.js cuando todo está cargado)
  App.start = function () {
    const { ctlBackground } = App.references || {};
    if (ctlBackground && typeof ctlBackground.play === "function") {
      ctlBackground.pause();
      delay(10000).then(() => {
        ctlBackground.setLoopByTime(10, 19);
      })
      
    }
    const s1 = App.screens["screen1"];
    if (s1 && typeof s1.zeroScreen === "function") {
      s1.zeroScreen();
    }
  };
})(window);