(function (global) {
  const { executeAnimation, getScreen, delay } = global.App.utils;
  const refs = global.App.references || {};
  const { playButtonStatic, closeButton } = refs;
  
  // Click del botón principal
  executeAnimation("click", "press-pop", playButtonStatic, 150, () => {
    const screen = getScreen();
    global.SoundAPI.play("boton");
    
    if (screen === 1 || screen === 2) {
      global.SoundAPI.play("musicabucle1", true);
      
      // Ir a la segunda pantalla
      if (global.App.screens && global.App.screens.screen2) {
        delay(200).then(() => global.App.screens.screen2.run());
      }
    } else {
      // Disparar paso a preguntas
      document.dispatchEvent(new CustomEvent("screen-four"));
    }
  });

  // Close (si aplica)
  executeAnimation("click", "press-pop", closeButton, 150);

  // Arranca la app cuando todo está cargado
  if (global.App.start) global.App.start();
})(window);
