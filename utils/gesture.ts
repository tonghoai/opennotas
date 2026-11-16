// One touch gesture can only belong to one owner at a time. The note row,
// pull-to-refresh and the drawer all listen to the same touch stream, so this
// tiny arbiter prevents a horizontal note swipe from also opening a drawer or
// a vertical pull from being mistaken for a note drag.

type GestureAxis = 'horizontal' | 'vertical';

let activeOwner: string | null = null;
let activeAxis: GestureAxis | null = null;
let completedOwner: string | null = null;
let completedAt = 0;

function resetGesture() {
  activeOwner = null;
  activeAxis = null;
}

function claimGesture(owner: string, axis: GestureAxis) {
  if (activeOwner && activeOwner !== owner) return false;
  activeOwner = owner;
  activeAxis = axis;
  return true;
}

function releaseGesture(owner: string) {
  if (activeOwner !== owner) return;
  resetGesture();
}

function completeGesture(owner: string) {
  completedOwner = owner;
  completedAt = performance.now();
}

function wasGestureJustCompleted(owner: string, windowMs = 420) {
  return completedOwner === owner && performance.now() - completedAt < windowMs;
}

function getGestureOwner() {
  return activeOwner;
}

function getGestureAxis() {
  return activeAxis;
}

export {
  claimGesture,
  completeGesture,
  getGestureAxis,
  getGestureOwner,
  releaseGesture,
  resetGesture,
  wasGestureJustCompleted,
};
export type { GestureAxis };
