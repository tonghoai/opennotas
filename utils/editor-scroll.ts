const CURSOR_BOTTOM_MARGIN = 120;
const SCROLL_EASE = 0.3;
const MIN_DELTA = 0.5;

let getCoordsRef: (() => { top: number; bottom: number } | null | undefined) | null = null;
let animating = false;

function step() {
  const container = document.getElementById('form-editors');
  if (!container || !getCoordsRef) {
    animating = false;
    return;
  }

  const coords = getCoordsRef();
  if (!coords) {
    animating = false;
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const distanceFromBottom = containerRect.bottom - coords.bottom;
  const delta = CURSOR_BOTTOM_MARGIN - distanceFromBottom;

  if (delta <= MIN_DELTA) {
    animating = false;
    return;
  }

  // ease toward the target margin instead of jumping straight to it; recomputing
  // the target every frame means a fresh keystroke just extends the same loop
  // instead of competing with it (this is what caused the native smooth-scroll
  // jerkiness: each keystroke restarted its own animation)
  container.scrollTop += delta * SCROLL_EASE;
  requestAnimationFrame(step);
}

function ensureCursorBottomMargin(getCoords: () => { top: number; bottom: number } | null | undefined) {
  getCoordsRef = getCoords;
  if (animating) return;

  animating = true;
  requestAnimationFrame(step);
}

export { ensureCursorBottomMargin };
