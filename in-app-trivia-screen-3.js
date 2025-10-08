(function (global) {
  const {
    updateClasses,
    moveSmooth,
    restartGif,
    delay,
    incScreen,
    animateLettersGrow,
  } = global.App.utils;

  const refs = global.App.references || {};
  const {
    titleGif,
    titleGifContainer,
    cagulaTitleMain,
    cagulaTitleSecondary,
    mapContainer,
    cagula,
    cagulaContainer,
    flameGifContainer,
    charactersBucle,
    playButtonContainer,
  } = refs;

  async function thirdScreen() {
    incScreen();

    await delay(1000);
    updateClasses([
      {
        element: playButtonContainer,
        remove: "h-[20vh]",
        add: "h-[10vh]",
      }
    ]);
    moveSmooth(playButtonContainer, cagula);
    if (titleGif) restartGif(titleGif);

    updateClasses([
      { element: titleGifContainer, add: "screen-3-1" },
      {
        element: cagulaTitleMain && cagulaTitleMain[0],
        add: "screen-3-1",
        remove: "active",
      },
      {
        element: cagulaTitleMain && cagulaTitleMain[1],
        add: "screen-3-1",
        remove: "active",
      },
      { element: mapContainer, add: "screen-3-1" },
      { element: cagulaTitleSecondary, remove: "active" },
      { element: cagula, add: "screen-3-1", remove: "h-[40%]" },
      { element: flameGifContainer, add: "screen-3-1", remove: "jump" },
    ]);

    await delay(200);
    updateClasses([
      { element: flameGifContainer, remove: "screen-3-1", add: "screen-3-2" },
    ]);
    await delay(200);

    moveSmooth(flameGifContainer, cagula, {
      mode: "reappear",
      duration: 1000,
      scale: false,
    });

    delay(3000).then(() => {
      updateClasses([
        {
          element: "#characters-gif-entry",
          remove: "visible",
          add: "not-visible",
        },
        { element: charactersBucle, remove: "not-visible", add: "visible" },
      ]);
    });

    await delay(600);
    updateClasses([
      { element: cagulaTitleMain && cagulaTitleMain[0], add: "hidden" },
      { element: cagulaTitleMain && cagulaTitleMain[1], add: "hidden" },
      { element: cagulaTitleSecondary, add: "hidden" },
      { element: ".title-cagula-third", add: "active" },
    ]);

    await delay(500);

    updateClasses([
      { element: ".title-cagula-third", add: "visible" },
      { element: ".title-cagula-third-container", add: "rombo" },
      { element: playButtonContainer, add: "screen-3-1" },
    ]);

    animateLettersGrow(".title-cagula-third.four", {
      effect: "fade-up",
      duration: 100,
      fromY: 30,
    });
  }

  // Mantén los mismos eventos que ya usas
  document.addEventListener("screen-three", thirdScreen);
  document.addEventListener("screen-five", thirdScreen);

  global.App.registerScreen("screen3", { run: thirdScreen });
})(window);
