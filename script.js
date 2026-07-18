(() => {
  "use strict";

  const scene = document.querySelector("#birthdayScene");
  const quest = document.querySelector("#quest");
  const storyLine = document.querySelector("#storyLine");
  const cloverButtons = [...document.querySelectorAll(".clover-button")];
  const emptySlots = [...document.querySelectorAll("[data-slot]")];
  const allSlots = [...document.querySelectorAll(".clover-slot")];
  const collection = document.querySelector("#collection");
  const collectedCount = document.querySelector("#collectedCount");
  const shootingStar = document.querySelector("#shootingStar");
  const sparkLayer = document.querySelector("#sparkLayer");
  const finale = document.querySelector("#finale");
  const cakeButton = document.querySelector("#cakeButton");
  const cakeImage = document.querySelector("#cakeImage");
  const cakeHint = document.querySelector("#cakeHint");
  const smoke = document.querySelector("#smoke");
  const finalMessage = document.querySelector("#finalMessage");
  const statusText = document.querySelector("#statusText");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const storyCopies = [
    "点击四叶草，收集剩下的小幸运",
    "第五片，是今天刚好赶来的好运。",
    "第六片，是悄悄许下的愿望。",
    "七片幸运，正在为你点亮今晚的极光。"
  ];

  const state = {
    collected: 0,
    busy: false,
    finaleVisible: false,
    candleBlown: false
  };

  const wait = (milliseconds) =>
    new Promise((resolve) =>
      window.setTimeout(resolve, prefersReducedMotion ? Math.min(milliseconds, 80) : milliseconds)
    );

  function preloadImages() {
    [
      "assets/bg-stage-1-sunset.png",
      "assets/bg-stage-2-bluehour.png",
      "assets/bg-stage-3-night.png",
      "assets/bg-stage-4-aurora.png",
      "assets/birthday-title.png",
      "assets/cake-lit.png",
      "assets/cake-blown.png",
      "assets/clover-glow.png"
    ].forEach((source) => {
      const image = new Image();
      image.src = source;
    });
  }

  // 固定随机种子，让每次打开时星空布局一致、画面更可控。
  function createStars() {
    let seed = 2507;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 46; index += 1) {
      const star = document.createElement("i");
      star.className = "star";
      star.style.left = `${4 + random() * 92}%`;
      star.style.top = `${2 + random() * 66}%`;
      star.style.setProperty("--size", `${0.8 + random() * 1.8}px`);
      star.style.setProperty("--duration", `${2.2 + random() * 3.8}s`);
      star.style.setProperty("--delay", `${random() * -5}s`);
      fragment.append(star);
    }
    document.querySelector("#stars").append(fragment);
  }

  function changeStoryCopy(copy) {
    storyLine.classList.add("is-changing");
    window.setTimeout(() => {
      storyLine.textContent = copy;
      storyLine.classList.remove("is-changing");
    }, prefersReducedMotion ? 10 : 420);
  }

  function createSpark(x, y, destinationX, destinationY, index) {
    const spark = document.createElement("i");
    const spread = (index - 7) * 2.7;
    spark.className = "spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--spark-size", `${2 + (index % 4)}px`);
    sparkLayer.append(spark);

    const midpointX = (destinationX - x) * 0.44 + spread;
    const midpointY = (destinationY - y) * 0.32 - 48 - Math.abs(spread);
    const animation = spark.animate(
      [
        { transform: "translate(0, 0) scale(0.4)", opacity: 0 },
        { transform: `translate(${spread}px, ${spread * -0.45}px) scale(1)`, opacity: 1, offset: 0.16 },
        { transform: `translate(${midpointX}px, ${midpointY}px) scale(0.8)`, opacity: 0.85, offset: 0.56 },
        { transform: `translate(${destinationX - x}px, ${destinationY - y}px) scale(0.2)`, opacity: 0 }
      ],
      {
        duration: prefersReducedMotion ? 100 : 920 + index * 25,
        delay: prefersReducedMotion ? 0 : index * 18,
        easing: "cubic-bezier(.22,.72,.25,1)",
        fill: "forwards"
      }
    );
    animation.finished.finally(() => spark.remove());
  }

  async function flyClover(button, destination) {
    const start = button.getBoundingClientRect();
    const end = destination.getBoundingClientRect();
    const clone = button.querySelector("img").cloneNode(true);
    const startCenterX = start.left + start.width / 2;
    const startCenterY = start.top + start.height / 2;
    const endCenterX = end.left + end.width / 2;
    const endCenterY = end.top + end.height / 2;
    const deltaX = endCenterX - startCenterX;
    const deltaY = endCenterY - startCenterY;

    clone.className = "flying-clover";
    Object.assign(clone.style, {
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`
    });
    document.body.append(clone);

    for (let index = 0; index < 15; index += 1) {
      createSpark(startCenterX, startCenterY, endCenterX, endCenterY, index);
    }

    const animation = clone.animate(
      [
        { transform: "translate(0, 0) scale(1) rotate(0)", opacity: 1 },
        {
          transform: `translate(${deltaX * 0.44}px, ${deltaY * 0.22 - 70}px) scale(.78) rotate(10deg)`,
          opacity: 1,
          offset: 0.53
        },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(.3) rotate(-8deg)`,
          opacity: 0.2
        }
      ],
      {
        duration: prefersReducedMotion ? 120 : 1250,
        easing: "cubic-bezier(.22,.72,.25,1)",
        fill: "forwards"
      }
    );

    button.classList.add("is-collecting");
    await animation.finished.catch(() => undefined);
    clone.remove();
    button.classList.add("is-collected");
  }

  function fillSlot(slot, number) {
    slot.style.setProperty("--slot-index", String(number + 4));
    slot.classList.add("is-filled", "just-filled");
    window.setTimeout(() => slot.classList.remove("just-filled"), prefersReducedMotion ? 60 : 1200);
  }

  function announce(message) {
    statusText.textContent = "";
    window.setTimeout(() => {
      statusText.textContent = message;
    }, 20);
  }

  async function collectClover(button) {
    if (state.busy || state.finaleVisible || button.classList.contains("is-collected")) return;

    state.busy = true;
    cloverButtons.forEach((item) => {
      item.disabled = true;
    });

    const currentIndex = state.collected;
    const destination = emptySlots[currentIndex];
    await flyClover(button, destination);
    fillSlot(destination, currentIndex);

    state.collected += 1;
    collectedCount.textContent = String(4 + state.collected);
    scene.dataset.stage = String(Math.min(state.collected + 1, 3));
    changeStoryCopy(storyCopies[state.collected]);
    announce(`已收集 ${4 + state.collected} 片四叶草`);

    if (state.collected === 2) {
      shootingStar.classList.remove("is-active");
      void shootingStar.offsetWidth;
      shootingStar.classList.add("is-active");
    }

    if (state.collected === 3) {
      await beginFinale();
      return;
    }

    await wait(420);
    cloverButtons.forEach((item) => {
      item.disabled = item.classList.contains("is-collected");
    });
    state.busy = false;
  }

  async function beginFinale() {
    collection.classList.add("is-complete");
    allSlots.forEach((slot, index) => {
      slot.style.setProperty("--slot-index", String(index));
    });

    // 七片先共同亮起，再切入极光，保留一小段仪式感停顿。
    await wait(1450);
    scene.dataset.stage = "4";
    quest.classList.add("is-leaving");
    await wait(1050);

    finale.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => finale.classList.add("is-visible"));
    });
    state.finaleVisible = true;
    state.busy = false;
    announce("七片幸运已经集齐，极光为你亮起");
  }

  async function blowOutCandle() {
    if (!state.finaleVisible || state.candleBlown) return;
    state.candleBlown = true;
    cakeButton.classList.add("is-blown");
    cakeButton.disabled = true;
    cakeImage.src = "assets/cake-blown.png";
    cakeImage.alt = "蜡烛已经吹灭的生日蛋糕";
    cakeHint.textContent = "";
    smoke.classList.add("is-active");
    announce("蜡烛已经吹灭，愿望已经收好");

    await wait(720);
    finalMessage.classList.add("is-visible");
  }

  cloverButtons.forEach((button) => {
    button.addEventListener("click", () => collectClover(button));
  });
  cakeButton.addEventListener("click", blowOutCandle);

  preloadImages();
  createStars();
  requestAnimationFrame(() => scene.classList.add("is-ready"));
})();

