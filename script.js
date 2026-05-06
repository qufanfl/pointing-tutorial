const touchpad = document.querySelector(".touchpad-ring");
const pointer = document.querySelector(".star-pointer");
const remote = document.querySelector(".remote-body");
const stage = document.querySelector(".space-stage");
const targetStar = document.querySelector(".target-star");
const constellationStars = [...document.querySelectorAll(".constellation-star")];
const starMap = document.querySelector(".star-map");
const starMapTrack = document.querySelector(".star-map-track");
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
let mapAnimationFrame;
let missionOneComplete = false;
let missionTwoActive = false;
let missionTwoComplete = false;
let missionThreeActive = false;
let constellationStep = 0;
let scrollPosition = 0;
let scrollVelocity = 0;
let isTouchpadPressed = false;
let lastTouchpadX = 0;

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
  updateStarMapScroll();
  pointerPosition.x += (targetPosition.x - pointerPosition.x) * 0.18;
  pointerPosition.y += (targetPosition.y - pointerPosition.y) * 0.18;
  renderPointer();
  updateStarReactions();
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

function getElementCenterInStage(element) {
  const stageRect = stage.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  return {
    x: elementRect.left - stageRect.left + elementRect.width / 2,
    y: elementRect.top - stageRect.top + elementRect.height / 2,
  };
}

function setReaction(element, center, radius, pull) {
  const distanceX = pointerPosition.x - center.x;
  const distanceY = pointerPosition.y - center.y;
  const distance = Math.hypot(distanceX, distanceY);
  const force = isPointing ? clamp(1 - distance / radius, 0, 1) : 0;
  const safeDistance = distance || 1;
  const offsetX = (distanceX / safeDistance) * force * pull;
  const offsetY = (distanceY / safeDistance) * force * pull;

  element.style.setProperty("--react-x", `${offsetX.toFixed(2)}px`);
  element.style.setProperty("--react-y", `${offsetY.toFixed(2)}px`);
  element.style.setProperty("--react-force", force.toFixed(3));
}

function updateStarReactions() {
  if (!missionOneComplete) {
    setReaction(targetStar, getElementCenterInStage(targetStar), 220, 10);
  }

  constellationStars.forEach((star, index) => {
    const shouldReact =
      missionTwoActive &&
      !missionTwoComplete &&
      (index === constellationStep || star.classList.contains("is-found"));

    if (!shouldReact) {
      setReaction(star, getElementCenterInStage(star), 1, 0);
      return;
    }

    setReaction(star, getElementCenterInStage(star), 170, index === constellationStep ? 8 : 3);
  });
}

function checkMissionOne() {
  if (missionOneComplete || !isPointing) {
    return;
  }

  const starCenter = getElementCenterInStage(targetStar);
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
  const starCenter = getElementCenterInStage(nextStar);
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
    window.setTimeout(startMissionThree, 1200);
    return;
  }

  constellationStars[constellationStep].classList.add("is-next");
}

function startMissionThree() {
  if (missionThreeActive) {
    return;
  }

  missionThreeActive = true;
  stage.classList.add("mission-three-active");
  missionLabel.textContent = "Mission 3";
  missionTitle.textContent = "성운을 넘겨보세요";
  missionInstruction.textContent = "터치패드를 누른 채 좌우로 밀어 별지도를 넘겨요.";
  progressDots[1].classList.remove("is-active");
  progressDots[2].classList.add("is-active");

  if (!mapAnimationFrame) {
    animateStarMap();
  }
}

function animateStarMap() {
  updateStarMapScroll();
  mapAnimationFrame = window.requestAnimationFrame(animateStarMap);
}

function updateStarMapScroll() {
  if (!missionThreeActive) {
    return;
  }

  const maxScroll = starMap.clientWidth * 2;

  if (isTouchpadPressed && Math.abs(scrollVelocity) > 0.2) {
    scrollPosition += scrollVelocity * 0.72;
  }

  scrollPosition = clamp(scrollPosition, 0, maxScroll);
  starMapTrack.style.setProperty("--map-scroll", `${-scrollPosition}px`);
}

touchpad.addEventListener("pointerenter", activatePointer);

touchpad.addEventListener("pointerdown", (event) => {
  if (!missionThreeActive) {
    return;
  }

  event.preventDefault();
  touchpad.setPointerCapture(event.pointerId);
  isTouchpadPressed = true;
  lastTouchpadX = event.clientX;
  scrollVelocity = 0;
  resetIdleTimer();
});

touchpad.addEventListener("pointermove", (event) => {
  if (!missionThreeActive || !isTouchpadPressed) {
    return;
  }

  const deltaX = event.clientX - lastTouchpadX;
  lastTouchpadX = event.clientX;
  scrollVelocity = -deltaX * 2.2;
  scrollPosition += scrollVelocity;
  resetIdleTimer();
});

function releaseTouchpadScroll() {
  isTouchpadPressed = false;
}

touchpad.addEventListener("pointerup", releaseTouchpadScroll);
touchpad.addEventListener("pointercancel", releaseTouchpadScroll);

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
