(function (global) {
  const {
    updateClasses,
    moveSmooth,
    delay,
    incScreen,
    animateLettersGrow,
    restartGif,
  } = global.App.utils;

  const refs = global.App.references || {};
  const {
    cagulaContainer,
    titleGifContainer,
    charactersContainer,
    questionsContainer,
    questionGifEntry,
    questionGifBucle,
    flameGifContainer,
    clockContainer,
    clock,
    question,
    optionContainer,
    optionA,
    optionB,
    optionC,
    optionSpan,
    fireWorks,
    body,
    musicButton,
    ctlBackground,
  } = refs;

  const todayQuestion =
    global.App.metadata?.question?.questionText ||
    "¿DE QUE PARTE DEL VACUNO VIENE EL BRISKET?";
  const correctAnswer =
    parseInt(global.App.metadata?.question?.questionAnswer, 10) || 0;
  const options = global.App.metadata?.question?.options || [
    "PECHO",
    "AGUJA",
    "LOMO VETADO",
  ];
  const questionType = global.App.metadata?.question?.questionType || "normal"; // sound or multiple
  const questionSound = global.App.metadata?.question?.questionSound || "";
  let answered = false;
  let readyToAnswer = false;
  // Devuelve normal, si alguna de las opciones tiene mas de 16 caracteres devuelve small
  const optionTextClass = options.some((opt) => opt.length > 16)
    ? "small"
    : "normal";
  // Cuenta cuanto debe bajar el contenedor de preguntas, por cada opción que tenga mas de 24 caracteres baja 5vh, la constante guarda el total a bajar adicional
  const extraQuestionDown = options.reduce((acc, opt) => {
    if (opt.length > 24) return acc - 5;
    return acc;
  }, 35);

  async function defineOptionsChilds(optionElement, optionText, optionId) {


    const optionSpan1 = optionSpan.cloneNode(true);
    optionSpan1.id = `${optionId}-span`;
    const optionSpan2 = optionSpan.cloneNode(true);
    optionSpan2.id = `${optionId}-bg`;
    optionElement.appendChild(optionSpan1);

    const title = document.createElement("h1");
    title.classList.add("option-text", "z-12", "text-[#202020]");
    title.textContent = optionText;
    title.classList.add(optionTextClass);
    if (optionText.length > 24) {
      optionElement.classList.remove("h-[10vh]");
      optionElement.classList.add("h-[15vh]");
    }
    updateClasses([
      {
        element: optionSpan1,
        add: ["rombo", "opacity-1", "bg-[#F8AE00]"],
        remove: ["opacity-0"],
      },
    ]);

    updateClasses([
      {
        element: optionSpan2,
        add: ["flex", "justify-center", "items-center"],
        
      },
    ]);

    await delay(200);
    optionSpan2.appendChild(title);
    animateLettersGrow(title, { effect: "fade-up", fromY: 30 });
    optionElement.appendChild(optionSpan2);
    updateClasses([
      {
        element: optionSpan2,
        add: ["rombo", "opacity-1", "bg-[#F9F4E3]"],
        remove: ["opacity-0"],
      },
    ]);
  }

  const musicDiv = document.createElement("div");
  async function forthScreen() {
    incScreen();

    ctlBackground.seekToFrame(0);
    global.SoundAPI.play("timer1", true);
    updateClasses([
      { element: cagulaContainer, add: "screen-4-1" },
      { element: titleGifContainer, add: "screen-4-1" },
      { element: charactersContainer, add: "screen-4-1" },
      { element: questionsContainer, add: "screen-4-1" },
      { element: questionsContainer, remove: "hidden" },
      { element: questionGifEntry, add: "visible" },
      { element: flameGifContainer, add: "screen-4-1", remove: "screen-3-1" },
      {
        element: musicButton,
        add: [
          "w-[70%]",
          "h-auto",
          "left-[15%]",
          "opacity-1",
          "align-center",
          "z-[100]",
          "transition-all",
          "duration-[100ms]",
          "relative",
        ],
      },
      {
        element: musicDiv,
        add: ["w-[60vw]", "h-auto", "absolute", "top-[33vh]", "z-10"],
      },
    ]);

    if (clockContainer && clock) clockContainer.appendChild(clock);

    if (question) {
      question.appendChild(questionGifEntry);
      question.appendChild(questionGifBucle);
      const soundTitle = "!ESCUCHA ATENTAMENTE!";
      const questionText = document.createElement("h1");
      questionText.id = "question-text";

      questionText.textContent =
        questionType === "sound" ? soundTitle : todayQuestion;
      // Change font size based on question length
      if (questionText.textContent.length > 48) {
        questionText.classList.add(["small"]);
      } else {
        questionText.classList.add("normal");
      }
      if (questionText.textContent.length <25) {
        questionText.classList.add("bottom-[43%]")
      } else {
        questionText.classList.add("bottom-[38%]")
      }
      question.appendChild(questionText);

      questionsContainer.appendChild(question);
      animateLettersGrow(questionText, {
        effect: "fade-up",
        duration: 50,
        fromY: 30,
      });
    }
    // Show temporary the music button and then hide it
    moveSmooth(flameGifContainer, document.querySelector("body"), {
      mode: "translate",
      duration: 1000,
    });
    if (questionType === "sound") {
      global.SoundAPI.setVolume("musicabucle1", 0.3, 1500);
      const title = document.createElement("div");
      title.classList.add(
        "w-[120%]",
        "left-[-10%]",
        "h-[8vh]",
        "opacity-0",
        "relative"
      );
      title.id = "music-text";
      musicDiv.appendChild(title);
      musicDiv.appendChild(musicButton);
      body.appendChild(musicDiv);
      await defineOptionsChilds(
        title,
        "!Presiona para escuchar!",
        "music-text"
      );
      updateClasses([
        { element: musicButton, remove: "opacity-0" },
        { element: title, remove: "opacity-0" },
        { element: musicDiv, add: "opacity-1" },
      ]);
      await delay(10000);
      global.SoundAPI.setVolume("musicabucle1", 1, 1500);

      updateClasses([{ element: musicDiv, add: "opacity-0" }]);
      restartGif(clock);
      const questionText = question.querySelector("#question-text");
      questionText.textContent = "¿QUÉ ESCUCHASTE RECIEN?";
      animateLettersGrow(questionText, {
        effect: "fade-up",
        duration: 50,
        fromY: 30,
      });
      await delay(100);
      updateClasses([{ element: musicDiv, add: "hidden" }]);
    }

    if (optionContainer) {
      optionContainer.classList.remove("bottom-[35vh]");
      optionContainer.classList.add(`bottom-[${extraQuestionDown}vh]`);
      if (optionA) optionContainer.appendChild(optionA);
      if (optionB) optionContainer.appendChild(optionB);
      if (optionC) optionContainer.appendChild(optionC);

      global.SoundAPI.play("pasodch");
      await defineOptionsChilds(optionA, options[0], "option-1");
      await delay(100);
      global.SoundAPI.play("pasodch");
      await defineOptionsChilds(optionB, options[1], "option-2");
      await delay(100);
      global.SoundAPI.play("pasodch");
      await defineOptionsChilds(optionC, options[2], "option-3");
    }
    readyToAnswer = true;

    setTimeout(() => {
      global.SoundAPI.stop("timer1");
      console.log("Time out");
      console.log("readyToAnswer", readyToAnswer);
      console.log("answered", answered);
      if (answered) return;
      answered = true;
      global.App.screens.screen5.run("not-answered");
    }, 11000);
  }
  musicDiv.addEventListener("click", async () => {
    updateClasses([{ element: musicButton, add: "press-pop" }]);
    await delay(100);
    updateClasses([{ element: musicButton, remove: "press-pop" }]);
    if (questionSound) {
      global.SoundAPI.play(questionSound);
    }
  });

  const optionsElements = [optionA, optionB, optionC];
  document.addEventListener("screen-four", forthScreen);
  optionsElements.forEach((element, index) => {
    element.addEventListener("click", async () => {
      document.dispatchEvent(new CustomEvent("option-selected"));
      if (answered || !readyToAnswer) return;
      global.SoundAPI.stop("timer1");
      global.SoundAPI.play("destello");

      answered = true;
      const isCorrect = index === correctAnswer;
      if (isCorrect) {
        fireWorks.classList.add(
          "absolute",
          "w-[100%]",
          "top-[50%]",
          "z-[5]",
          "translate-y-[-50%]"
        );
        body.appendChild(fireWorks);

        optionsElements.forEach((el, i) => {
          updateClasses([
            {
              element: el,
              add: i === index ? "correct-answer" : "wrong-answer",
              remove:
                i === index ? [] : ["w-[80%]", "h-[10vh]", "text-[5vh]", ""],
            },
          ]);
        });
        await delay(2000);
        if (global.App.screens && global.App.screens.screen5) {
          global.App.screens.screen5.run("correct");
        }
      } else {
        if (global.App.screens && global.App.screens.screen5) {
          global.App.screens.screen5.run("wrong");
        }
      }
    });
  });

  global.App.registerScreen("screen4", { run: forthScreen });
})(window);
