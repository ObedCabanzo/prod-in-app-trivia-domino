(function (global) {
  const {
    updateClasses,
    delay,
    incScreen,
    generateMap,
    animateMapEntrance,
    appendGifWithFinalImage,
  } = global.App.utils;

  const refs = global.App.references || {};
  const {
    flameGifContainer,
    clockContainer,
    correctGif,
    body,
    mapContainer,
    titleGifContainer,
    cagulaContainer,
    cagula,
    incorrectGif,
    loseCouponGif,
    flameGifBucle,
    winCouponGif,
    completeStreak,
    streakCompleted,
    flameSad,
    timeOverGif,
    ctlBackground,
    allUrls,
    gameResult,
  } = refs;
  const bottomGifClasses = [
    "bottom-[0vh]",
    "absolute",
    "flex",
    "justify-center",
    "items-center",
    "w-full",
    "h-[40vh]",
    "transition-all",
    "duration-1000",
  ];
  async function sixthScreen(response) {
    const gifContainerResult = document.getElementById("gif-container-result");

    updateClasses([
      {
        element: streakCompleted,
        add: ["h-[15vh]", "top-[50vh]", "w-auto", "absolute"],
      },
      {
        element: completeStreak,
        add: ["h-[15vh]", "top-[50vh]", "w-auto", "absolute"],
      },
    ]);
    const finalResult = gameResult();
    console.log("Final Result:", finalResult);
    if (global.App.metadata.config.gameFinished) {
      body.appendChild(streakCompleted);
    } else {
      body.appendChild(completeStreak);
    }
    if (finalResult === "all-correct" && response === "not-answered") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.couponFree,
        allUrls.images.couponFreeFinal,
        2000,
        bottomGifClasses
      );
    } else if (finalResult === "some-correct" && response === "not-answered") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.coupon40,
        allUrls.images.coupon40Final,
        2000,
        bottomGifClasses
      );
    } else if (response === "not-answered") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.coupon10,
        allUrls.images.coupon10Final,
        2000,
        bottomGifClasses
      );
      appendGifWithFinalImage(
      gifContainerResult,
      allUrls.gifs.askButton,
      allUrls.images.askButtonFinal,
      2000,
      [
        "bottom-[0%]",
        "left-[20%]",
        "absolute",
        "w-[50%]",
        "h-[30%]",
        "transition-all",
      ],
      "get-coupon-button-container"
    );
    }
    updateClasses([
      {
        element: gifContainerResult,
        add: ["h-[40vh]", "bottom-[0vh]"],
        remove: ["h-[50vh]", "bottom-[5vh]"],
      },
    ]);
    appendGifWithFinalImage(
      gifContainerResult,
      allUrls.gifs.askButton,
      allUrls.images.askButtonFinal,
      2000,
      [
        "bottom-[0%]",
        "left-[20%]",
        "absolute",
        "w-[50%]",
        "h-[30%]",
        "transition-all",
      ],
      "get-coupon-button-container"
    );

    const getCouponButton = document.getElementById(
      "get-coupon-button-container"
    );


    console.log("Get coupon button element:", getCouponButton);

    getCouponButton?.addEventListener("click", async function () {
      console.log("Get coupon button clicked");
      updateClasses([{ element: getCouponButton, add: "scale-[0.8]", remove: "scale-[1]"}]); 
      await delay(200);
      updateClasses([{ element: getCouponButton, add: "scale-[1]", remove: "scale-[0.8]"}]);
      const deeplinkUrl = global.App.metadata.config.deeplink || "domino.cl://offers";
      global.location.href = deeplinkUrl;
      if (global.brazeBridge){
        global.brazeBridge.logClick("get-coupon-button");
        global.brazeBridge.closeMessage();
      }
    });
    incScreen();
    ctlBackground.setLoopByTime(10, 19);
    updateClasses([
      {
        element: titleGifContainer,
        remove: ["screen-5-1", "screen-4-1"],
        add: "screen-6-1",
      },

      {
        element: cagulaContainer,
        remove: ["screen-4-1", "hidden"],
        add: "screen-6-1",
      },
      { element: incorrectGif, add: "opacity-0" },
      { element: correctGif, add: "opacity-0" },
      { element: winCouponGif, add: "opacity-0" },
      { element: loseCouponGif, add: "opacity-0" },
      { element: timeOverGif, add: ["opacity-0", "hidden"] },
      { element: flameSad, add: "opacity-0" },
      { element: cagula, add: "hidden" },
      { element: clockContainer, add: "hidden" },
      {
        element: mapContainer,
        remove: ["hidden", "screen-3-1"],
        add: "screen-6-1",
      },
    ]);
    delay(1500).then(() => {
      const finalMessageContainer = document.createElement("div");
      finalMessageContainer.id = "final-message-container";
      finalMessageContainer.classList = ["w-auto", "h-[10vh]"];

      updateClasses([
        {
          element: streakCompleted,
          remove: ["opacity-0", "translate-y-[100%]"],
          add: "translate-y-0",
        },
      ]);
    });
    const octClasses = [
      "flex",
      "flex-col",
      "justify-center",
      "items-center",
      "gap-2",
    ];
    const octId = document.getElementById("map-container-october").id;
    mapContainer.removeChild(document.getElementById("map-container-october"));

    const octClone = document.createElement("div");
    octClone.id = octId;
    octClone.classList = octClasses;
    mapContainer.appendChild(octClone);

    generateMap(octClone, 7, 22);
    updateClasses([
      {
        element: flameGifContainer,
        remove: [
          "hidden",
          "screen-4-1",
          "screen-3-2",
          "screen-2-2",
          "screen-2-1",
        ],
        add: "screen-6-1",
      },
      {
        element: flameGifBucle,
        add: "not-visible",
        remove: "visible",
      },
    ]);
    delay(800).then(() => {
      updateClasses([
        {
          element: flameGifContainer,
          remove: "opacity-0",
          add: ["screen-6-2", "jump"],
        },
        { element: flameGifBucle, remove: "not-visible", add: "visible" },
      ]);
    });
    await animateMapEntrance();
    updateClasses([{ element: mapContainer, add: "screen-6-2" }]);

    await delay(1000);

    updateClasses([
      { element: incorrectGif, add: "hidden" },
      { element: winCouponGif, add: "hidden" },
    ]);
  }

  global.App.registerScreen("screen6", { run: sixthScreen });
})(window);
