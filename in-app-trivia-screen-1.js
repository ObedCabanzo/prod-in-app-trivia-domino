(function (global) {
  const { onElementReady, updateClasses, delay, incScreen, restartGif } =
    global.App.utils;
  const refs = global.App.references || {};
  const {
    titleGif,
    titleGifContainer,
    flameGifContainer,
    flameGifEntry,
    flameGifBucle,
    playButtonGif,
    playButtonStatic,
    playButtonContainer,
    closeButton,
    bgContainer,
    ctlBackground,
  } = refs;

  const loader = global.App.Loader;
  const { hideLoadingScreen, showLoadingScreen } =
    global.App.loadingScreen || {};

  async function zeroScreen() {
    
    document.addEventListener("assetpreloader:setcomplete", (event) => {
      if (event.detail.setIndex === 0) {
        console.log("Assets preloaded:", event.detail);
        const image = document.getElementById("title-gif-entry");
        const imageBucle = document.getElementById("title-gif-bucle");
        setImageSrc(
          image,
          "https://raw.githubusercontent.com/ObedCabanzo/public-assets/main/trivia/gif/Logo_Armado.gif"
        );
        setImageSrc(
          imageBucle,
          "https://raw.githubusercontent.com/ObedCabanzo/public-assets/main/trivia/gif/Logo_Armado.gif"
        );
        //hideLoadingScreen();
        firstScreen();
      }
    });
  }

  //Function for adding src to an image element
  function setImageSrc(img, src) {
    if (img && src) {
      img.src = src;
    }
  }

  async function firstScreen() {
    

    incScreen();

    ctlBackground.play();
    global.SoundAPI.play("musicabucle1", true);
    updateClasses([
      { element: bgContainer, remove: "hidden" },
      { element: titleGifContainer, remove: "hidden" },
    ]);
    restartGif(titleGif);
    restartGif(playButtonGif);
    restartGif(flameGifEntry);

    await delay(500);

    onElementReady(titleGif, () => {
      delay(1000)
        .then(() => {
          updateClasses([{ element: titleGifContainer, add: "move-up" }]);
          if (flameGifContainer) {
            if (flameGifEntry) flameGifContainer.appendChild(flameGifEntry);
            if (flameGifBucle) flameGifContainer.appendChild(flameGifBucle);
          }
          delay(1200).then(() => {
            global.SoundAPI.play("destello");
            updateClasses([
              { element: playButtonContainer, remove: "opacity-0" },
              { element: closeButton, remove: "opacity-0" },
            ]);
          });
        })
        .then(() => {
          delay(5500).then(() => {
            updateClasses([
              { element: flameGifEntry, add: "not-visible" },
              { element: flameGifBucle, add: "visible" },
            ]);
          });
        });
    });

    delay(3000).then(() => {
      updateClasses([
        { element: playButtonStatic, remove: "hidden" },
        { element: "#play-button-gif", add: "hidden" },
      ]);
    });
  }

  global.App.registerScreen("screen1", { zeroScreen, firstScreen });
})(window);
