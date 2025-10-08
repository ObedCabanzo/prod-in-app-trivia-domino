(function (global) {
  const mainUrl =
    "https://raw.githubusercontent.com/ObedCabanzo/public-assets/main/trivia";

const allUrls = {
  images: {
    flameSad: mainUrl + "/images/flame_sad.png",
    musicButton: mainUrl + "/images/Boton_play.png",
    coupon10Final: mainUrl + "/images/coupon10_final.png",
    coupon20Final: mainUrl + "/images/coupon20_final.png",
    coupon40Final: mainUrl + "/images/coupon40_final.png",
    couponFreeFinal: mainUrl + "/images/couponFree_final.png",
    askButtonFinal: mainUrl + "/images/askButton_final.png",
  },
  gifs: {
    completeStreak: mainUrl + "/gif/CompletaLaRacha.gif",
    streakCompleted: mainUrl + "/gif/CompletasteLaRacha.gif",
    winCoupon: mainUrl + "/gif/Ganaste_Encuesta_Cupon.gif",
    loseCoupon: mainUrl + "/gif/Pierde_Cupon30.gif",
    timeOver: mainUrl + "/gif/Up_tiempo.gif",
    correct: mainUrl + "/gif/Excelente.gif",
    incorrect: mainUrl + "/gif/Incorrecto.gif",
    charactersEntry: mainUrl + "/gif/Personajes_X3_Intro.gif",
    charactersBucle: mainUrl + "/gif/Personajes_X3_Bucle.gif",
    flameEntry: mainUrl + "/gif/Llama_Intro.gif",
    flameBucle: mainUrl + "/gif/Llama_Generica.gif",
    timer: mainUrl + "/gif/Timer.gif",
    questionEntry: mainUrl + "/gif/Pregunta_Intro_Rojo_Vacio.gif",
    questionBucle: mainUrl + "/gif/Pregunta_Cierre_Rojo_Vacio.gif",
    fireworks: mainUrl + "/gif/Particle_Fireworks.gif",
    coupon10: mainUrl + "/gif/Cupon_Brisket_10_sinboton.gif",
    coupon20: mainUrl + "/gif/Cupon_Brisket_20_sinboton.gif",
    coupon40: mainUrl + "/gif/Cupon_Completos_40_sinboton.gif",
    couponFree: mainUrl + "/gif/Cupon_Brisket_Gratis_sinboton.gif",
    askButton: mainUrl + "/gif/Boton_PideAqui.gif",
  },
  sounds: {
    boton: mainUrl + "/sound/boton.mp3",
    choque: mainUrl + "/sound/Choque.mp3",
    clasicow: mainUrl + "/sound/Clasicow.mp3",
    cocrantitow: mainUrl + "/sound/Crocantitow.mp3",
    derratidow: mainUrl + "/sound/Derratidow.mp3",
    destello: mainUrl + "/sound/Destello.mp3",
    gameover1: mainUrl + "/sound/GameOver_1.mp3",
    gameover2: mainUrl + "/sound/GameOver_2.mp3",
    musicabucle1: mainUrl + "/sound/Musica_Bucle.mp3",
    musicabucle2: mainUrl + "/sound/Musica_Bucle2.mp3",
    pasodch: mainUrl + "/sound/Paso_Dch.mp3",
    pasoizq: mainUrl + "/sound/Paso_Izq.mp3",
    salto1: mainUrl + "/sound/Salto_1.mp3",
    salto2: mainUrl + "/sound/Salto_2.mp3",
    timer1: mainUrl + "/sound/Timer.mp3",
    timer2: mainUrl + "/sound/Timer12.mp3",
    transicion1: mainUrl + "/sound/transicion_1.mp3",
    transicion2: mainUrl + "/sound/transicion_2.mp3",
    win: mainUrl + "/sound/Win.mp3"
  },
  videos: {}
};
  const cagula = document.getElementById("cagula");
  const cagulaContainer = document.getElementById("cagula-container");
  const mapContainer = document.getElementById("map-container");
  const charactersContainer = document.getElementById("characters-container");

  global.SoundAPI.loadSounds({
    boton: mainUrl + "/sound/boton.mp3",
    choque: mainUrl + "/sound/Choque.mp3",
    clasicow: mainUrl + "/sound/Clasicow.mp3",
    cocrantitow: mainUrl + "/sound/Crocantitow.mp3",
    derratidow: mainUrl + "/sound/Derratidow.mp3",
    destello: mainUrl + "/sound/Destello.mp3",
    gameover1: mainUrl + "/sound/GameOver_1.mp3",
    gameover2: mainUrl + "/sound/GameOver_2.mp3",
    musicabucle1: mainUrl + "/sound/Musica_Bucle.mp3",
    musicabucle2: mainUrl + "/sound/Musica_Bucle2.mp3",
    pasodch: mainUrl + "/sound/Paso_Dch.mp3",
    pasoizq: mainUrl + "/sound/Paso_Izq.mp3",
    salto1: mainUrl + "/sound/Salto_1.mp3",
    salto2: mainUrl + "/sound/Salto_2.mp3",

    timer1: mainUrl + "/sound/Timer.mp3",
    timer2: mainUrl + "/sound/Timer12.mp3",
    transicion1: mainUrl + "/sound/transicion_1.mp3",
    transicion2: mainUrl + "/sound/transicion_2.mp3",
    win: mainUrl + "/sound/Win.mp3",
  });

  const completeStreak = document.createElement("img");
  completeStreak.src = allUrls.gifs.completeStreak;
  completeStreak.alt = "Complete Streak";
  completeStreak.id = "complete-streak-gif";
  const streakCompleted = document.createElement("img");
  streakCompleted.src = allUrls.gifs.streakCompleted;
  streakCompleted.alt = "Streak Complete";
  streakCompleted.id = "streak-completed-gif";

  const winCouponGif = document.createElement("img");
  winCouponGif.src = allUrls.gifs.winCoupon;
  winCouponGif.alt = "You Win";
  winCouponGif.id = "win-gif";
  const loseCouponGif = document.createElement("img");
  loseCouponGif.src = allUrls.gifs.loseCoupon;
  loseCouponGif.alt = "You Lose";
  loseCouponGif.id = "lose-gif";
  const timeOverGif = document.createElement("img");
  timeOverGif.src = allUrls.gifs.timeOver;
  timeOverGif.alt = "Time Over";
  timeOverGif.id = "timeover-gif";

  const correctGif = document.createElement("img");
  correctGif.src = allUrls.gifs.correct;
  correctGif.alt = "Correct Answer";
  correctGif.id = "correct-gif";

  const incorrectGif = document.createElement("img");
  incorrectGif.src = allUrls.gifs.incorrect;
  incorrectGif.alt = "Incorrect Answer";
  incorrectGif.id = "incorrect-gif";

  const flameSad = document.createElement("img");
  flameSad.src = allUrls.images.flameSad;
  flameSad.alt = "Flame Sad";
  flameSad.id = "flame-sad-img";

  const bgContainer = document.getElementById("bg-container");

  const charactersEntry = document.createElement("img");
  charactersEntry.alt = "Characters Bucle";
  charactersEntry.id = "characters-gif-entry";
  charactersEntry.src = allUrls.gifs.charactersEntry;
  const charactersBucle = document.createElement("img");
  charactersBucle.alt = "Characters Bucle";
  charactersBucle.id = "characters-gif-bucle";
  charactersBucle.src = allUrls.gifs.charactersBucle;
  const flameGifContainer = document.getElementById("flame-gif-container");
  const flameGifEntry = document.createElement("img");
  flameGifEntry.src = allUrls.gifs.flameEntry;
  const flameGifBucle = document.createElement("img");
  flameGifBucle.src = allUrls.gifs.flameBucle;
  flameGifBucle.alt = "Flame Bucle";
  flameGifBucle.id = "flame-gif-bucle";
  flameGifEntry.alt = "Flame Entry";
  flameGifEntry.id = "flame-gif-entry";
  const clock = document.createElement("img");
  clock.classList.add("clock");
  clock.src = allUrls.gifs.timer;
  clock.id = "clock-gif";
  const clockContainer = document.getElementById("clock-container");
  const questionGifEntry = document.createElement("img");
  questionGifEntry.id = "question-gif-entry";
  questionGifEntry.src = allUrls.gifs.questionEntry;
  const questionGifBucle = document.createElement("img");
  questionGifBucle.id = "question-gif-bucle";
  questionGifBucle.src = allUrls.gifs.questionBucle;

  const question = document.getElementById("question");

  const cagulaTitleMain = document
    .getElementById("cagula")
    .querySelectorAll(".title-cagula-main");
  const cagulaTitleSecondary = document
    .getElementById("cagula")
    .querySelector(".title-cagula-secondary");

  const backgroundVideo = document.getElementById("bg-video");
  const titleGif = document.getElementById("title-gif-entry");
  const titleGifBucle = document.getElementById("title-gif-bucle");
  const titleGifContainer = document.getElementById("title-gif-container");
  const playButtonContainer = document.getElementById("play-button-container");
  const playButtonGif = document.getElementById("play-button-gif");
  const playButtonStatic = document.getElementById("play-button-static");
  const closeButton = document.getElementById("close-button");
  const kidsVideo = document.getElementById("kids-video");
  const questionsContainer = document.getElementById("question-container");
  const ctlBackground = new VideoLoopController(backgroundVideo, { fps: 30 });
  const optionContainer = document.getElementById("options-container");

  const musicButton = document.createElement("img");
  musicButton.src = allUrls.images.musicButton;
  musicButton.alt = "Music On/Off";
  musicButton.id = "music-button";

  const option = document.createElement("div");
  option.classList.add(
    "relative",
    "-skew-y-2",
    "h-[10vh]",
    "text-white",
    "text-center",
    "w-[80%]",
    "px-8",
    "z-11"
  );
  const optionSpan = document.createElement("div");
  optionSpan.classList.add(
    "w-full",
    "h-full",
    "absolute",
    "top-0",
    "left-0",
    "z-10",
    "opacity-0"
  );

  const optionA = option.cloneNode(true);
  optionA.id = "option-1";
  const optionB = option.cloneNode(true);
  optionB.id = "option-2";
  const optionC = option.cloneNode(true);
  optionC.id = "option-3";

  const fireWorks = document.createElement("img");
  fireWorks.src = allUrls.gifs.fireworks;
  fireWorks.alt = "Fireworks";
  fireWorks.id = "fireworks";

  const coupon10 = document.createElement("img");
  coupon10.src = allUrls.gifs.coupon10;
  coupon10.alt = "10% Coupon";
  coupon10.id = "coupon-10";

  const coupon20 = document.createElement("img");
  coupon20.src = allUrls.gifs.coupon20;
  coupon20.alt = "20% Coupon";
  coupon20.id = "coupon-20";

  const coupon40 = document.createElement("img");
  coupon40.src = allUrls.gifs.coupon40;
  coupon40.alt = "40% Coupon";
  coupon40.id = "coupon-40";

  const couponFree = document.createElement("img");
  couponFree.src = allUrls.gifs.couponFree;
  couponFree.alt = "Free Coupon";
  couponFree.id = "coupon-free";

  const askButton = document.createElement("img");
  askButton.src = allUrls.gifs.askButton;
  askButton.alt = "Ask Button";
  askButton.id = "ask-button";

  const streakDays = global.App.metadata.streakDays;
  const updateStreak = (gameResult) => {
    global.App.metadata.config.result = gameResult;
  
    if (gameResult === "correct") {
      global.App.metadata.streakDays = updateStringIndex(
        global.App.metadata.streakDays,
        global.App.metadata.config.daysPassed - 1,
        '1'
      );

    }
  };

  const updateStringIndex = (str, index, newChar) => {
    if (index < 0 || index >= str.length) {
      return str; // Index out of bounds, return original string
    }
    return str.substring(0, index) + newChar + str.substring(index + 1);
  };

  const updateUserFinished = (finished) => {
    global.App.metadata.user.finished = finished;
  };
  function updateResponse(response)  {
    global.App.metadata.config.result = response;
  }

  const gameResult = () => {
    // Verifica si es el ultimo día de la racha, y si el usuario ha respondido correctamente todas las preguntas, o parcialmente.
    const isLastDay = global.App.metadata.config.gameFinished;
    const allCorrect = !global.App.metadata.streakDays.includes('0');
    const someCorrect = global.App.metadata.streakDays.includes('1');
    const finalResponse = global.App.metadata.config.result;
    

    if (isLastDay) {
      if (allCorrect) {
        return "all-correct";
      } else if (someCorrect) {
        return "some-correct";
      }
    } else  {
      return finalResponse;
    }
  }

  const body = document.querySelector("body");
  // --- expone en un único namespace ---
  global.App = global.App || {};
  global.App.references = Object.assign(global.App.references || {}, {
    cagula,
    cagulaContainer,
    mapContainer,
    charactersContainer,
    charactersEntry,
    charactersBucle,
    flameGifContainer,
    flameGifEntry,
    flameGifBucle,
    clock,
    clockContainer,
    questionGifEntry,
    questionGifBucle,
    question,
    cagulaTitleMain,
    cagulaTitleSecondary,
    backgroundVideo,
    titleGif,
    titleGifBucle,
    titleGifContainer,
    playButtonContainer,
    playButtonGif,
    playButtonStatic,
    closeButton,
    kidsVideo,
    questionsContainer,
    ctlBackground,
    optionContainer,
    optionSpan,
    optionA,
    optionB,
    optionC,
    streakDays,
    fireWorks,
    body,
    winCouponGif,
    loseCouponGif,
    timeOverGif,
    correctGif,
    incorrectGif,
    updateStreak,
    completeStreak,
    streakCompleted,
    flameSad,
    musicButton,
    updateUserFinished,
    bgContainer,
    coupon10,
    coupon20,
    coupon40,
    couponFree,
    askButton,
    allUrls,
    gameResult,
    updateResponse
  });
})(window);
