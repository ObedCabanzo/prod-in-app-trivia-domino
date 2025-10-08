// Wait for the `brazeBridge` ready event, "ab.BridgeReady"
(function (global) {
  const { getScreen, delay, updateClasses } = global.App.utils;
  const { playButtonStatic, closeButton, gameResult } =
    global.App.references || {};
  // metadata
  const metadata = global.App.metadata;

  // Simulate brazeBridge for testing purposes

  const brazeBridge = global.brazeBridge;

  window.addEventListener(
    "ab.BridgeReady",
    function () {
      brazeBridge.logCustomEvent("trivia-impression");
      brazeBridge.requestImmediateDataFlush();

      const offlineAbortBtn = document.getElementById("offline-abort");
      const tooMuchDelayAbandonBtn = document.getElementById(
        "too-much-delay-abandon-btn"
      );
      const closeBtn = document.getElementById("close-button");
      closeBtn.addEventListener("click", function () {
        brazeBridge.logClick("close-button-screen-" + getScreen());
        brazeBridge.requestImmediateDataFlush();
        brazeBridge.closeMessage();
      });

      

      const getCouponButton = document.getElementById(
        "get-coupon-button-container"
      );

      getCouponButton?.addEventListener("click", async function () {
        console.log("Get coupon button clicked");
        updateClasses([{ element: getCouponButton, add: "scale-[0.8]" }]);
        await delay(200);
        updateClasses([{ element: getCouponButton, remove: "scale-[1]" }]);
        brazeBridge.logClick("get-coupon-button");
        brazeBridge.requestImmediateDataFlush();
        const deeplinkUrl = metadata?.config.deeplink || "domino.cl://offers";
        global.location.href = deeplinkUrl;
        brazeBridge.closeMessage();
      });

      playButtonStatic.addEventListener("click", function () {
        brazeBridge.requestImmediateDataFlush();

        brazeBridge.logClick("play-button-screen-" + screen);
      });

      document.addEventListener("option-selected", async function () {
        brazeBridge.requestImmediateDataFlush();

        brazeBridge.logClick("option-selected");
      });
    },
    false
  );
})(window);
