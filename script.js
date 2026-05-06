const touchpad = document.querySelector(".touchpad-ring");
const pointer = document.querySelector(".star-pointer");
const remote = document.querySelector(".remote-body");
const stage = document.querySelector(".space-stage");
const targetStar = document.querySelector(".target-star");
const constellationStars = [...document.querySelectorAll(".constellation-star")];
const starMap = document.querySelector(".star-map");
const starMapTrack = document.querySelector(".star-map-track");
const centerStar = document.querySelector(".center-star");
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
let transitionTimer;
let hintTimer;
let activeInstruction = "";
let activeHint = "";
let missionOneComplete = false;
let missionTwoActive = false;
let missionTwoComplete = false;
let missionThreeActive = false;
let missionThreeComplete = false;
let centerRepositionActive = false;
let centerRepositionComplete = false;
let tutorialComplete = false;
let constellationStep = 0;
let scrollPosition = 0;
let scrollVelocity = 0;
let isTouchpadPressed = false;
let lastTouchpadX = 0;
let lastTouchpadMoveAt = 0;
let scrollHoldDirection = 0;
let lastTapAt = 0;

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

function setMission(index, label, title, instruction, hint = "") {
  progressDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
  missionLabel.textContent = label;
  missionTitle.textContent = title;
  activeInstruction = instruction;
  activeHint = hint;
  missionInstruction.textContent = instruction;
  scheduleHint();
}

function scheduleHint() {
  window.clearTimeout(hintTimer);

  if (!activeHint) {
    return;
  }

  hintTimer = window.setTimeout(() => {
    missionInstruction.textContent = activeHint;
  }, 7000);
}

function noteUserAction() {
  if (activeInstruction && missionInstruction.textContent === activeHint) {
    missionInstruction.textContent = activeInstruction;
  }

  scheduleHint();
}

function scheduleTransition(nextStep, delay = 1200) {
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(nextStep, delay);
}

function animatePointer() {
  applyEdgeAssist();
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
  if (!isPointing || isTouchpadPressed) {
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

  noteUserAction();
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
  window.clearTimeout(hintTimer);
  missionInstruction.textContent = "좋아요. 별빛이 깨어났어요.";

  scheduleTransition(startMissionTwo);
}

function startMissionTwo() {
  if (missionTwoActive) {
    return;
  }

  missionTwoActive = true;
  stage.classList.add("mission-two-active");
  setMission(1, "Mission 2", "별자리를 이어보세요", "빛나는 별을 차례로 따라가요.", "다음 별에 포인터를 가까이 가져가세요.");
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
  noteUserAction();
  constellationStep += 1;

  if (constellationStep > 1) {
    stage.classList.add(`constellation-line-${constellationStep - 1}-active`);
  }

  if (constellationStep >= constellationStars.length) {
    missionTwoComplete = true;
    stage.classList.add("mission-two-complete");
    window.clearTimeout(hintTimer);
    missionInstruction.textContent = "별자리를 찾았어요.";
    scheduleTransition(startMissionThree);
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
  setMission(
    2,
    "Mission 3",
    "숨겨진 별자리를 찾아요",
    "터치패드를 밀어 별지도를 넘겨요.",
    "짧게 밀면 조금, 길게 잡으면 별지도가 계속 흘러요.",
  );

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
  const boundarySlack = starMap.clientWidth * 0.12;
  const hiddenConstellationCenter = starMap.clientWidth * 2.52;
  const viewportCenter = starMap.clientWidth / 2;
  const centerDistance = Math.abs(hiddenConstellationCenter - scrollPosition - viewportCenter);
  const centerForce = clamp(1 - centerDistance / (starMap.clientWidth * 0.24), 0, 1);

  if (isTouchpadPressed && scrollHoldDirection) {
    const holdSpeed = 5.6;
    scrollVelocity += (scrollHoldDirection * holdSpeed - scrollVelocity) * 0.08;
  }

  if (Math.abs(scrollVelocity) > 0.05) {
    scrollPosition += scrollVelocity;
  }

  if (scrollPosition < 0) {
    scrollVelocity += (0 - scrollPosition) * 0.045;
  } else if (scrollPosition > maxScroll) {
    scrollVelocity += (maxScroll - scrollPosition) * 0.045;
  }

  scrollVelocity *= isTouchpadPressed ? 0.985 : 0.94;
  scrollPosition = clamp(scrollPosition, -boundarySlack, maxScroll + boundarySlack);

  if (!isTouchpadPressed && scrollPosition < 0 && Math.abs(scrollVelocity) < 0.7) {
    scrollPosition += (0 - scrollPosition) * 0.14;
  }

  if (!isTouchpadPressed && scrollPosition > maxScroll && Math.abs(scrollVelocity) < 0.7) {
    scrollPosition += (maxScroll - scrollPosition) * 0.14;
  }

  if (Math.abs(scrollVelocity) < 0.05) {
    scrollVelocity = 0;
  }

  starMapTrack.style.setProperty("--map-scroll", `${-scrollPosition}px`);
  starMap.style.setProperty("--hidden-force", centerForce.toFixed(3));

  if (!missionThreeComplete && centerForce > 0.82) {
    missionThreeComplete = true;
    stage.classList.add("mission-three-complete");
    window.clearTimeout(hintTimer);
    missionInstruction.textContent = "숨겨진 별자리를 찾았어요.";
    scheduleTransition(startCenterReposition);
  }
}

function startCenterReposition() {
  if (centerRepositionActive) {
    return;
  }

  const rect = stage.getBoundingClientRect();
  centerRepositionActive = true;
  stage.classList.add("center-reposition-active");
  setMission(3, "Mission 4", "중심별로 돌아오세요", "터치패드를 두 번 톡톡 두드려요.", "빠르게 두 번 탭해보세요.");
  targetPosition = {
    x: rect.width * 0.82,
    y: rect.height * 0.28,
  };
}

function completeCenterReposition() {
  if (!centerRepositionActive || centerRepositionComplete) {
    return;
  }

  const rect = stage.getBoundingClientRect();
  centerRepositionComplete = true;
  targetPosition = {
    x: rect.width / 2,
    y: rect.height / 2,
  };
  stage.classList.add("center-reposition-complete");
  pointer.classList.add("is-repositioning");
  window.clearTimeout(hintTimer);
  missionInstruction.textContent = "완료. 중심으로 돌아왔어요.";
  resetIdleTimer();

  window.setTimeout(() => {
    pointer.classList.remove("is-repositioning");
  }, 900);

  scheduleTransition(showCompletionState, 1100);
}

function showCompletionState() {
  if (tutorialComplete) {
    return;
  }

  tutorialComplete = true;
  window.clearTimeout(hintTimer);
  stage.classList.add("tutorial-complete");
  progressDots.forEach((dot) => {
    dot.classList.add("is-complete");
    dot.classList.remove("is-active");
  });
  missionInstruction.textContent = "튜토리얼을 완료했어요.";
}

touchpad.addEventListener("pointerenter", activatePointer);

touchpad.addEventListener("pointerdown", (event) => {
  const now = performance.now();

  if (centerRepositionActive && now - lastTapAt < 320) {
    event.preventDefault();
    lastTapAt = 0;
    noteUserAction();
    completeCenterReposition();
    return;
  }

  lastTapAt = now;

  if (!missionThreeActive || missionThreeComplete) {
    return;
  }

  event.preventDefault();
  touchpad.setPointerCapture(event.pointerId);
  isTouchpadPressed = true;
  lastTouchpadX = event.clientX;
  lastTouchpadMoveAt = performance.now();
  scrollHoldDirection = Math.sign(scrollVelocity) || scrollHoldDirection || 1;
  noteUserAction();
  resetIdleTimer();
});

touchpad.addEventListener("pointermove", (event) => {
  if (!missionThreeActive || !isTouchpadPressed) {
    return;
  }

  const deltaX = event.clientX - lastTouchpadX;
  const now = performance.now();
  const elapsed = Math.max(now - lastTouchpadMoveAt, 16);
  lastTouchpadX = event.clientX;
  lastTouchpadMoveAt = now;
  scrollVelocity = scrollVelocity * 0.22 + (-deltaX / elapsed) * 18;
  scrollHoldDirection = Math.sign(-deltaX) || scrollHoldDirection;
  scrollPosition += -deltaX * 1.35;
  noteUserAction();
  resetIdleTimer();
});

function releaseTouchpadScroll() {
  isTouchpadPressed = false;
  scrollHoldDirection = 0;
  scrollVelocity *= 1.18;
}

touchpad.addEventListener("pointerup", releaseTouchpadScroll);
touchpad.addEventListener("pointercancel", releaseTouchpadScroll);

document.addEventListener("pointermove", (event) => {
  if (!isPointing) {
    return;
  }

  if (missionThreeActive && isTouchpadPressed) {
    lastInput = { x: event.clientX, y: event.clientY };
    resetIdleTimer();
    return;
  }

  const deltaX = event.clientX - lastInput.x;
  const deltaY = event.clientY - lastInput.y;
  lastInput = { x: event.clientX, y: event.clientY };
  movePointerBy(deltaX, deltaY);
  noteUserAction();
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
    noteUserAction();
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
setMission(0, "Mission 1", "별빛을 깨워보세요", "터치패드에 손을 대고 첫 별을 찾아요.", "파란 원형 터치패드에 마우스를 올려보세요.");
