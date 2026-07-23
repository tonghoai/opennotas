import { watch, type Ref } from "vue";

type BackHandler = () => void;

const backStack: BackHandler[] = [];
let isProgrammaticBack = false;

function pushMobileBackState(onBack: BackHandler) {
  window.history.pushState({}, '');
  backStack.push(onBack);
}

function closeMobileBackState() {
  if (!backStack.length) return;
  backStack.pop();
  isProgrammaticBack = true;
  window.history.back();
}

function initMobileBackHandler() {
  window.addEventListener('popstate', () => {
    if (isProgrammaticBack) {
      isProgrammaticBack = false;
      return;
    }

    const onBack = backStack.pop();
    onBack?.();
  });
}

function useMobileBackToggle(stateRef: Ref<boolean>) {
  let isClosingViaBack = false;
  watch(stateRef, (isOpen) => {
    if (isOpen) {
      pushMobileBackState(() => {
        isClosingViaBack = true;
        stateRef.value = false;
      });
      return;
    }

    if (isClosingViaBack) {
      isClosingViaBack = false;
      return;
    }

    closeMobileBackState();
  });
}

export { pushMobileBackState, closeMobileBackState, initMobileBackHandler, useMobileBackToggle };
