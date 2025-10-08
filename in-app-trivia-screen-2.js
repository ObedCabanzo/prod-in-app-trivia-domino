(function (global) {
  const {
    updateClasses,
    animateLettersGrow,
    delay,
    incScreen,
    generateMap,
    animateMapEntrance,
  } = global.App.utils;

  const refs = global.App.references || {};
  const {
    playButtonContainer,
    flameGifContainer,
    cagula,
    cagulaContainer,
    titleGifContainer,
    mapContainer,
    charactersContainer,
    charactersEntry,
    charactersBucle,
    cagulaTitleMain,
    cagulaTitleSecondary,
  } = refs;

  async function secondScreen() {
    incScreen();

    updateClasses([
      { element: playButtonContainer, add: "screen-2-1" },
      { element: flameGifContainer, add: "screen-2-1" },
      { element: cagula, add: "screen-2" },
      { element: cagulaContainer, add: ["screen-2", "bottom-[15vh]"], remove: ["bottom-[10vh]"] },
      { element: titleGifContainer, add: "screen-2" },
      { element: mapContainer, add: "screen-2" },
    ]);

    delay(200).then(async () => {
      updateClasses([{ element: cagulaTitleMain && cagulaTitleMain[0], add: "active" }]);
      updateClasses([{ element: cagulaTitleSecondary, add: "active" }]);
      if (cagulaTitleMain && cagulaTitleMain[0]) animateLettersGrow(cagulaTitleMain[0]);
      await delay(500);
      updateClasses([{ element: cagulaTitleMain && cagulaTitleMain[1], add: "active" }]);
      if (cagulaTitleMain && cagulaTitleMain[1]) animateLettersGrow(cagulaTitleMain[1]);
    });

    delay(0).then(async () => {
      if (charactersContainer && charactersEntry) charactersContainer.appendChild(charactersEntry);
      //  Oct 7–22
      generateMap(new Date("2025-10-03"), new Date( "2025-10-18"));
      await delay(500);
      await animateMapEntrance();
      delay(1000).then(()=> {
        updateClasses([{
          element: flameGifContainer, add: "hidden"
        }]);
      }).then(()=> {
        delay(500).then(()=> {
          updateClasses([{
          element: flameGifContainer, remove: "hidden"
        }]);
        });

      });
      
      document.dispatchEvent(new CustomEvent("screen-three"));
    });

    delay(3000).then(() => {
      if (charactersContainer && charactersBucle) charactersContainer.appendChild(charactersBucle);
      updateClasses([
        { element: charactersEntry, add: "not-visible" },
        { element: charactersBucle, add: "visible", remove: "not-visible" },
      ]);
    });
  }

  // Opcional: escucha si quieres dispararla por evento
  document.addEventListener("go-screen-2", secondScreen);

  global.App.registerScreen("screen2", { run: secondScreen });
})(window);