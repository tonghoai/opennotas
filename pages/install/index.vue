<script setup lang="ts">
import PWA from '../assets/svg/pwa.svg?component';
import Safari from '../assets/svg/safari.svg?component';
import ShareSquare from '../assets/svg/share-square.svg?component';
import AddSquare from '../assets/svg/add-square.svg?component';
import Dock from '../assets/svg/dock.svg?component';

const isInited = ref<boolean>(false);
const isSupportWeb = ref<boolean>(true);
const isSupportPWA = ref<boolean>(false);
const isSupportHalfPWA = ref<boolean>(false);
const isSafariDesktop = ref<boolean>(false);
const isSafariMobile = ref<boolean>(false);

onMounted(() => {
  const ua = navigator.userAgent;
  isSupportWeb.value = checkIsSupportWeb(ua);
  isSupportPWA.value = checkIsSupportPWA(ua);
  isSupportHalfPWA.value = checkIsSupportHalfPWA(ua);
  isSafariDesktop.value = checkIsSafariDesktop(ua);
  isSafariMobile.value = checkIsSafariMobile(ua);
  isInited.value = true;
});

onMounted(() => {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', (event) => {
    if (window.location.pathname !== '/app') {
      window.location.href = '/app';
    }
  });

  document.querySelector('#install-btn') && document.querySelector('#install-btn')!.addEventListener('click', (e) => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
      } else {
      }
      deferredPrompt = null;
    });
  });
});
</script>

<template>
  <div class="h-screen max-w-screen-sm m-auto p-4 flex flex-col justify-center items-center">
    <img :src="'/logo.png'" class="w-24 h-24" alt="Logo">
    <h1 class="mt-2 text-3xl font-semibold">{{ $t('app_name') }}</h1>
    <p class="mt-6 text-center">
      {{ $t('landing.slogan') }}
    </p>

    <div v-show="isSupportPWA && !isSupportHalfPWA" class="mt-4 flex justify-center items-center">
      <a id="install-btn" class="btn btn-primary">
        <PWA />
        {{ $t('landing.install_app') }}
      </a>
    </div>

    <div class="mt-4" v-if="isSupportHalfPWA && isSafariMobile">
      <div>
        <div class="mt-4 grid grid-cols-5 gap-4">
          <div class="col-span-1 flex items-center justify-center">
            <Safari class="w-5 h-5" />
          </div>
          <div class="col-span-4">
            1, Open in Safari Browser
          </div>
        </div>

        <div class="mt-4 grid grid-cols-5 gap-4">
          <div class="col-span-1 flex items-center justify-center">
            <ShareSquare class="w-5 h-5" />
          </div>
          <div class="col-span-4">
            2, Press Share in Navigation bar
          </div>
        </div>

        <div class="mt-4 grid grid-cols-5 gap-4">
          <div class="col-span-1 flex items-center justify-center">
            <AddSquare class="w-4 h-4" />
          </div>
          <div class="col-span-4">
            3, Press Add to Home Screen
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4" v-if="isSupportHalfPWA && isSafariDesktop">
      <div class="mt-4 grid grid-cols-5 gap-4">
        <div class="col-span-1 flex items-center justify-center">
          <ShareSquare class="w-5 h-5" />
        </div>
        <div class="col-span-4">
          1, Press Share in Navigation bar
        </div>
      </div>

      <div class="mt-4 grid grid-cols-5 gap-4">
        <div class="col-span-1 flex items-center justify-center">
          <Dock class="w-5 h-5" />
        </div>
        <div class="col-span-4">
          2, Press Add to Dock
        </div>
      </div>
    </div>

    <div class="mt-4" v-if="isInited && !isSupportPWA && !isSupportHalfPWA">
      <div role="alert" class="alert alert-warning text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>{{ $t('landing.browser_not_support') }}</span>
      </div>
    </div>
  </div>
</template>
