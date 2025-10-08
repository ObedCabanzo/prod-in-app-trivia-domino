// Wait for the `brazeBridge` ready event, "ab.BridgeReady"
(function (global) {
  const { getScreen, delay, updateClasses } = global.App.utils;
  const { playButtonStatic, closeButton, gameResult } =
    global.App.references || {};
  // metadata
  const metadata = global.App.metadata;

  // Simulate brazeBridge for testing purposes

  
  window.addEventListener(
    "ab.BridgeReady",

    function () {
      const brazeBridge = global.brazeBridge;

      brazeBridge.logCustomEvent("trivia-impression");
      brazeBridge.requestImmediateDataFlush();

      const closeBtn = document.getElementById("close-button");
      closeBtn.addEventListener("click", function () {
        brazeBridge.logClick("close-button-screen-" + getScreen());
        brazeBridge.requestImmediateDataFlush();
        brazeBridge.closeMessage();
      });

      const offlineAbortBtn = document.getElementById("offline-abort");
      const tooMuchDelayAbortBtn = document.getElementById(
        "too-much-delay-abandon-btn"
      );
      closeButton.addEventListener("click", function () {
        brazeBridge.logClick("close-button");
        brazeBridge.requestImmediateDataFlush();
        brazeBridge.closeMessage();
      });

      if (offlineAbortBtn) {
        offlineAbortBtn.addEventListener("click", () => {
          // Si el host define un abort handler, úsalo; si no, emitimos evento
          brazeBridge.logClick("abort-button-offline");
          brazeBridge.requestImmediateDataFlush();
          brazeBridge.closeMessage();
        });
      }

      if (tooMuchDelayAbortBtn) {
        tooMuchDelayAbortBtn.addEventListener("click", () => {
          // Si el host define un abort handler, úsalo; si no, emitimos evento
          brazeBridge.logClick("abort-button-delay");
          brazeBridge.requestImmediateDataFlush();
          brazeBridge.closeMessage();
        });
      }

      const getCouponButton = document.getElementById(
        "get-coupon-button-container"
      );

      getCouponButton?.addEventListener("click", async function () {

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
        brazeBridge.logClick("play-button-screen-" + screen);
        brazeBridge.requestImmediateDataFlush();
      });

      document.addEventListener("option-selected", async function () {
        brazeBridge.logClick("option-selected");
        brazeBridge.requestImmediateDataFlush();
      });
    },
    false
  );
})(window);
