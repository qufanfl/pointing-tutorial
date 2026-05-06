const touchpad = document.querySelector(".touchpad-ring");
const pointer = document.querySelector(".star-pointer");
const remote = document.querySelector(".remote-body");
const stage = document.querySelector(".space-stage");
const targetStar = document.querySelector(".target-star");
const constellationStars = [...document.querySelectorAll(".constellation-star")];
const missionInstruction = document.querySelector(".mission-instruction");
const missionLabel = document.querySelector(".step-label");
const missionTitle = document.querySelector(".intro-copy h1");
const progressDots = [...document.querySelectorAll(".progress-dot")];

let fadeTimer;
let idleTimer;
let isPointing = false;
let lastInput = { x: 0, y: 0 };
let lastEdgeAssistAt = 0;
let pointerPosition = { x: 0, y: 0 };
let targetPosition = { x: 0, y: 0 };
let animationFrame;
let missionOneComplete = false;
let missionTwoActive = false;
let missionTwoComplete = false;
let constellationStep = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setInitialPointerPosition() {
  const rect = stage.getBoundingClientRect();
  pointerPosition = {
    x: rect.width * 0.46,
    y: rect.height * 0.52,
  };
  targetPosition = { ...pointerPosition };
  renderPointer();
}

function renderPointer() {
  pointer.style.setProperty("--pointer-x", `${pointerPosition.x}px`);
  pointer.style.setProperty("--pointer-y", `${pointerPosition.y}px`);
}

function animatePointer() {
  applyEdgeAssist();
  pointerPosition.x += (targetPosition.x - pointerPosition.x) * 0.18;
  pointerPosition.y += (targetPosition.y - pointerPosition.y) * 0.18;
  renderPointer();
  checkMissionOne();
  checkMissionTwo();
  animationFrame = window.requestAnimationFrame(animatePointer);
}

function movePointerBy(deltaX, deltaY) {
  const rect = stage.getBoundingClientRect();
  const speed = 1.8;

  targetPosition.x = clamp(targetPosition.x + deltaX * speed, 24, rect.width - 24);
  targetPosition.y = clamp(targetPosition.y + deltaY * speed, 24, rect.height - 24);
}

function applyEdgeAssist() {
  if (!isPointing) {
    return;
  }

  const edgeSize = 20;
  const edgeStep = 2.4;
  let edgeX = 0;
  let edgeY = 0;

  if (lastInput.x <= edgeSize) {
    edgeX = -edgeStep;
  } else if (lastInput.x >= window.innerWidth - edgeSize) {
    edgeX = edgeStep;
  }

  if (lastInput.y <= edgeSize) {
    edgeY = -edgeStep;
  } else if (lastInput.y >= window.innerHeight - edgeSize) {
    edgeY = edgeStep;
  }

  if (!edgeX && !edgeY) {
    return;
  }

  const before = { ...targetPosition };
  movePointerBy(edgeX, edgeY);
  const moved = before.x !== targetPosition.x || before.y !== targetPosition.y;

  if (moved && performance.now() - lastEdgeAssistAt > 500) {
    lastEdgeAssistAt = performance.now();
    resetIdleTimer();
  }
}

function activatePointer(event) {
  window.clearTimeout(fadeTimer);
  pointer.classList.add("is-visible", "is-pointing");
  pointer.classList.remove("is-fading");
  remote.classList.add("is-pointing");
  isPointing = true;

  if (event) {
    lastInput = { x: event.clientX, y: event.clientY };
  }

  if (!animationFrame) {
    animatePointer();
  }

  resetIdleTimer();
}

function hidePointer() {
  pointer.classList.remove("is-pointing");
  remote.classList.remove("is-pointing");
  isPointing = false;

  pointer.classList.add("is-fading");
  pointer.classList.remove("is-visible");
  window.cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
}

function resetIdleTimer() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(hidePointer, 3000);
}

function checkMissionOne() {
  if (missionOneComplete || !isPointing) {
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const starRect = targetStar.getBoundingClientRect();
  const starCenter = {
    x: starRect.left - stageRect.left + starRect.width / 2,
    y: starRect.top - stageRect.top + starRect.height / 2,
  };
  const distance = Math.hypot(pointerPosition.x - starCenter.x, pointerPosition.y - starCenter.y);

  if (distance > 54) {
    return;
  }

  missionOneComplete = true;
  stage.classList.add("mission-one-complete");
  targetStar.classList.add("is-awake");
  missionInstruction.textContent = "좋아요. 별빛이 깨어났어요.";

  window.setTimeout(startMissionTwo, 1200);
}

function startMissionTwo() {
  if (missionTwoActive) {
    return;
  }

  missionTwoActive = true;
  stage.classList.add("mission-two-active");
  missionLabel.textContent = "Mission 2";
  missionTitle.textContent = "별자리를 이어보세요";
  missionInstruction.textContent = "빛나는 별을 순서대로 따라가요.";
  progressDots[0].classList.remove("is-active");
  progressDots[1].classList.add("is-active");
  constellationStars[0].classList.add("is-next");
}

function checkMissionTwo() {
  if (!missionTwoActive || missionTwoComplete || !isPointing) {
    return;
  }

  const nextStar = constellationStars[constellationStep];
  const stageRect = stage.getBoundingClientRect();
  const starRect = nextStar.getBoundingClientRect();
  const starCenter = {
    x: starRect.left - stageRect.left + starRect.width / 2,
    y: starRect.top - stageRect.top + starRect.height / 2,
  };
  const distance = Math.hypot(pointerPosition.x - starCenter.x, pointerPosition.y - starCenter.y);

  if (distance > 48) {
    return;
  }

  nextStar.classList.remove("is-next");
  nextStar.classList.add("is-found");
  constellationStep += 1;

  if (constellationStep > 1) {
    stage.classList.add(`constellation-line-${constellationStep - 1}-active`);
  }

  if (constellationStep >= constellationStars.length) {
    missionTwoComplete = true;
    stage.classList.add("mission-two-complete");
    missionInstruction.textContent = "별자리를 찾았어요.";
    return;
  }

  constellationStars[constellationStep].classList.add("is-next");
}

touchpad.addEventListener("pointerenter", activatePointer);

document.addEventListener("pointermove", (event) => {
  if (!isPointing) {
    return;
  }

  const deltaX = event.clientX - lastInput.x;
  const deltaY = event.clientY - lastInput.y;
  lastInput = { x: event.clientX, y: event.clientY };
  movePointerBy(deltaX, deltaY);
  resetIdleTimer();
});

touchpad.addEventListener("keydown", (event) => {
  const keyMove = {
    ArrowUp: [0, -18],
    ArrowDown: [0, 18],
    ArrowLeft: [-18, 0],
    ArrowRight: [18, 0],
  };

  if (keyMove[event.code] && isPointing) {
    event.preventDefault();
    targetPosition.x = clamp(targetPosition.x + keyMove[event.code][0], 24, stage.clientWidth - 24);
    targetPosition.y = clamp(targetPosition.y + keyMove[event.code][1], 24, stage.clientHeight - 24);
    resetIdleTimer();
    return;
  }

  if (event.code !== "Space" && event.code !== "Enter") {
    return;
  }

  event.preventDefault();
  activatePointer();
});

window.addEventListener("resize", setInitialPointerPosition);

setInitialPointerPosition();
