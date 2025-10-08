(function (global) {
  const { updateClasses, delay, incScreen, appendGifWithFinalImage } =
    global.App.utils;

  const refs = global.App.references || {};
  const {
    flameGifContainer,
    clockContainer,
    optionContainer,
    fireWorks,
    body,
    titleGifContainer,
    incorrectGif,
    correctGif,
    updateStreak,
    timeOverGif,
    flameSad,
    updateUserFinished,
    ctlBackground,
    coupon10,
    coupon20,
    allUrls,
    gameResult,
    updateResponse,
  } = refs;

  const { metadata } = global.App;

  // Verifies if a string is a valid date in YYYY-MM-DD format and returns it in that format, if not returns ""
  function isADate(dateStr) {
    // Validar formato YYYY-M-D o YYYY-MM-DD con regex (permite 1 o 2 dígitos para mes y día)
    console.log("dateStr:", dateStr);
    console.log("dateStr type:", typeof dateStr);
    console.log("dateStr length:", dateStr?.length);
    console.log("dateStr JSON:", JSON.stringify(dateStr));
    
    // Convertir a string y limpiar espacios si es necesario
    const cleanDateStr = String(dateStr).trim();
    console.log("cleanDateStr:", cleanDateStr);
    
    const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
    const testResult = dateRegex.test(cleanDateStr);
    console.log("Regex test result:", testResult);
    
    if (!testResult) {
      return {response: false, date: ""};
    }
    return {response: true, date: `${cleanDateStr}_`};
  }

  async function fifthScreen(response) {
    document.addEventListener("final-response", function (e) {
      console.log("Braze brdge", brazeBridge);
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const formattedToday = `${yyyy}-${mm}-${dd}_`;
      const currentDate = metadata.config.currentDate;


      const response = e.detail.response;
      const finalResult = gameResult();
      
      console.log(isADate(currentDate));

      console.log("Final-response-click");
      let prizeCode = "";
      if (finalResult === "all-correct") {
        brazeBridge.logCustomEvent("trivia-final-result-all-correct");
        prizeCode = metadata.config.codeCouponFree;
      } else if (finalResult === "some-correct") {
        brazeBridge.logCustomEvent("trivia-final-result-some-correct");
        prizeCode = metadata.config["codeCoupon-40"];
      } else if (response === "not-answered") {
        brazeBridge.logCustomEvent("trivia-result-not-answered");
        prizeCode = metadata.config["codeCoupon-10"];
      } else if (response === "wrong") {
        brazeBridge.logCustomEvent("trivia-result-wrong");
        prizeCode = metadata.config["codeCoupon-10"];
      } else if (response === "correct") {
        brazeBridge.logCustomEvent("trivia-result-correct");
        prizeCode = metadata.config["codeCoupon-20"];
      }
      if (response === "correct") {
        brazeBridge
          .getUser()
          .addToCustomAttributeArray("trivia-streak-days", isADate(currentDate).response ? isADate(currentDate).date : formattedToday);
      }
      console.log("Prize code to send:", prizeCode);
      brazeBridge.requestImmediateDataFlush();

      try {
        fetch(metadata.config.apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Brand-Token": metadata.config.token,
          },
          body: JSON.stringify({
            customer_account_id: metadata.user.userId,
            device_uuid: metadata.user.deviceUuid,
            promotion_codes: prizeCode,
          }),
        });
      } catch (error) {
        console.error("Error sending prize code:", error);
      }
    });

    updateResponse(response);
    updateStreak(response);
    document.dispatchEvent(
      new CustomEvent("final-response", { detail: { response } })
    );
    const finalResult = gameResult();
    incScreen();

    const bottomGifClasses = [
      "bottom-[5vh]",
      "absolute",
      "flex",
      "justify-center",
      "items-center",
      "w-full",
      "h-[50vh]",
      "transition-all",
      "duration-1000",
    ];

    if (response !== "not-answered") {
      updateClasses([
        {
          element: titleGifContainer,
          add: "screen-5-1",
          remove: ["screen-4-1", "w-[80vw]"],
        },
        { element: clockContainer, add: "hidden" },
      ]);
    }
    updateClasses([
      { element: optionContainer, add: "hidden" },
      { element: fireWorks, add: "hidden" },
      { element: flameGifContainer, add: "hidden" },
      { element: "#question", add: "hidden" },
      {
        element: incorrectGif,
        add: [
          "top-[50vh]",
          "absolute",
          "w-full",
          "h-auto",
          "transition-all",
          "duration-1000",
        ],
      },
      {
        element: correctGif,
        add: [
          "top-[50vh]",
          "absolute",
          "w-full",
          "h-auto",
          "transition-all",
          "duration-1000",
        ],
      },
      {
        element: timeOverGif,
        add: [
          "top-[20vh]",
          "absolute",
          "w-full",
          "h-auto",
          "transition-all",
          "duration-1000",
          "z-[11]",
        ],
      },
      {
        element: coupon10,
        add: [
          "bottom-[5vh]",
          "absolute",
          "w-auto",
          "h-[50vh]",
          "transition-all",
          "duration-1000",
        ],
      },
      {
        element: coupon20,
        add: [
          "bottom-[5vh]",
          "absolute",
          "w-auto",
          "h-[50vh]",
          "transition-all",
          "duration-1000",
        ],
      },
      {
        element: flameSad,
        add: [
          "bottom-[2vh]",
          "absolute",
          "w-auto",
          "h-[50vh]",
          "transition-all",
          "duration-1000",
          "z-[10]",
        ],
      },
    ]);

    if (response === "correct") {
      ctlBackground.clearLoop({ keepPlaying: true });
      global.SoundAPI.play("win");

      ctlBackground.seekToFrame(0);
      delay(10000).then(() => {
        ctlBackground.setLoopByTime(10, 19);
      });

      body.appendChild(correctGif);
      await delay(1000);
      updateClasses([
        {
          element: correctGif,
          add: ["top-[30vh]", "w-[80%]"],
          remove: ["w-full", "top-[50vh]"],
        },
      ]);
    } else if (response === "wrong") {
      global.SoundAPI.play("choque");
      global.SoundAPI.play("gameover2");
      global.SoundAPI.setVolume("musicabucle1", 0.4, 1500);

      ctlBackground.clearLoop({ keepPlaying: true });
      ctlBackground.seekToFrame(600);
      body.appendChild(incorrectGif);
      await delay(1000);
      updateClasses([
        {
          element: incorrectGif,
          add: ["top-[30vh]", "w-[80%]"],
          remove: ["w-full", "top-[50vh]"],
        },
      ]);
    } else if (response === "not-answered") {
      global.SoundAPI.play("choque");
      global.SoundAPI.setVolume("musicabucle1", 0.4, 1500);
      global.SoundAPI.play("gameover1");

      ctlBackground.clearLoop({ keepPlaying: true });
      ctlBackground.seekToFrame(600);
      body.appendChild(timeOverGif);
      body.appendChild(flameSad);
    }

    if (finalResult === "all-correct" && response !== "not-answered") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.couponFree,
        allUrls.images.couponFreeFinal,
        2000,
        bottomGifClasses
      );
    } else if (finalResult === "some-correct" && response !== "not-answered") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.coupon40,
        allUrls.images.coupon40Final,
        2000,
        bottomGifClasses
      );
    } else if (response === "wrong") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.coupon10,
        allUrls.images.coupon10Final,
        2000,
        bottomGifClasses
      );
    } else if (response === "correct") {
      appendGifWithFinalImage(
        body,
        allUrls.gifs.coupon20,
        allUrls.images.coupon20Final,
        2000,
        bottomGifClasses
      );
    }

    if (response !== "not-answered") {
      await delay(4000);
    } else {
      await delay(3000);
    }
    // Pass to next screen

    if (global.App.screens && global.App.screens.screen6) {
      global.SoundAPI.setVolume("gameover1", 0, 1500);
      global.SoundAPI.setVolume("gameover2", 0, 1500);
      global.SoundAPI.setVolume("musicabucle1", 1, 1500);
      global.SoundAPI.play("pasodch");
      updateUserFinished(true);
      global.App.screens.screen6.run(response);
    }
  }

  global.App.registerScreen("screen5", { run: fifthScreen });
})(window);
