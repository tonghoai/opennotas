<script setup lang="ts">
import Language from '../assets/svg/language.svg?component';
import PWA from '../assets/svg/pwa.svg?component';
import Simple from '../assets/svg/simple.svg?component';
import Platform from '../assets/svg/platform.svg?component';
import Sync from '../assets/svg/sync.svg?component';
import Security from '../assets/svg/security.svg?component';
import Globe from '../assets/svg/globe.svg?component';
import { setInstalledApp } from '~/services/main';

useHead({
  title: 'OpenNotas - The best personal note-taking app, fast, secure, and free',
  meta: [
    {
      name: 'description',
      content: 'OpenNotas is an open-source, multi-platform note-taking application based on PWA, focusing on| security and synchronization capabilities across devices.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: 'https://opennotas.io/',
    },
    {
      property: 'og:title',
      content: 'OpenNotas - The best personal note-taking app, fast, secure, and free',
    },
    {
      property: 'og:description',
      content: 'OpenNotas is an open-source, multi-platform note-taking application based on PWA, focusing on| security and synchronization capabilities across devices.',
    },
    {
      property: 'og:image',
      content: 'https://opennotas.io/banner.webp',
    },
    {
      property: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      property: 'twitter:url',
      content: 'https://opennotas.io/',
    },
    {
      property: 'twitter:title',
      content: 'OpenNotas - The best personal note-taking app, fast, secure, and free',
    },
    {
      property: 'twitter:description',
      content: 'OpenNotas is an open-source, multi-platform note-taking application based on PWA, focusing on| security and synchronization capabilities across devices.',
    },
    {
      property: 'twitter:image',
      content: 'https://opennotas.io/banner.webp',
    },
  ],
});

const { setLocale } = useI18n();

onMounted(() => {
  // add overflow auto to body
  document.body.style.overflow = 'auto';
});

const isSupportWeb = ref<boolean>(true);
const isSupportPWA = ref<boolean>(false);
const isSupportHalfPWA = ref<boolean>(false);

onMounted(() => {
  const ua = navigator.userAgent;
  isSupportWeb.value = checkIsSupportWeb(ua);
  isSupportPWA.value = checkIsSupportPWA(ua);
  isSupportHalfPWA.value = checkIsSupportHalfPWA(ua);
});

onMounted(() => {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  document.querySelectorAll('.install-btn') && document.querySelectorAll('.install-btn')!.forEach(selector => {
    selector.addEventListener('click', (e) => {
      if (isSupportHalfPWA.value || !isSupportPWA.value) {
        e.preventDefault();
        location.href = '/install';
        return;
      }

      try {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            setInstalledApp();
          }
          deferredPrompt = null;
        });
      } catch (err) {
        location.href = '/install';
      }
    });
  })
});

const scrollToHome = () => {
  const homeElm = document.querySelector('#home')!;
  _scrollTo(homeElm);
}

const scrollToFeature = () => {
  const featureElm = document.querySelector('#feature')!;
  _scrollTo(featureElm);
}

const scrollToSignature = () => {
  const signatureElm = document.querySelector('#signature')!;
  _scrollTo(signatureElm);
}

const scrollToFaq = () => {
  const faqElm = document.querySelector('#faq')!;
  _scrollTo(faqElm);
}

const _scrollTo = (elm: Element) => {
  elm && elm.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <div class="landing max-w-screen-lg mx-auto">
    <div id="home" class="navbar bg-base-100">
      <div class="flex-1">
        <img :src="'/logo-icon.png'" width="72" height="72" alt="OpenNotas Logo">
      </div>
      <div class="flex-none hidden lg:flex">
        <ul class="menu flex-row items-center menu-horizontal px-1">
          <li @click="scrollToHome"><a>{{ $t('landing.navbar_home') }}</a></li>
          <li @click="scrollToFeature"><a>{{ $t('landing.navbar_feature') }}</a></li>
          <li @click="scrollToSignature"><a>{{ $t('landing.navbar_signature') }}</a></li>
          <li><a href="https://docs.opennotas.io" target="_blank">{{ $t('landing.navbar_document') }}</a></li>
          <li @click="scrollToFaq"><a>{{ $t('landing.navbar_faqs') }}</a></li>
          <li>
            <div class="dropdown p-0">
              <div tabindex="0" role="button" class="btn btn-sm btn-ghost">
                <Language />
              </div>
              <ul tabindex="0" class="dropdown-content z-[1] menu p-2 border rounded-box w-36"
                style="top: 42px; left: 0">
                <li @click="setLocale('vi')"><a>{{ $t('vi') }}</a></li>
                <li @click="setLocale('en')"><a>{{ $t('en') }}</a></li>
              </ul>
            </div>
          </li>
          <li><a class="install-btn btn btn-sm btn-primary ml-4">{{ $t('landing.install_app') }}</a></li>
        </ul>
      </div>
    </div>

    <div class="overflow-hidden relative px-4 lg:px-0 h-[calc(100vh_-_90px)]">
      <div class="text-center pb-16">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-8">
          <a class="flex justify-center md:justify-end"
            href="https://www.producthunt.com/posts/opennotas?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-opennotas"
            target="_blank"><img
              src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=455329&theme=light&period=daily"
              alt="OpenNotas - The&#0032;best&#0032;personal&#0032;note&#0045;taking&#0032;app&#0044;&#0032;fast&#0044;&#0032;secure&#0032;&#0038;&#0032;free | Product Hunt"
              style="width: 250px; height: 54px;" width="250" height="54" /></a>

          <a class="flex justify-center md:justify-start"
            href="https://www.producthunt.com/posts/opennotas?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-opennotas"
            target="_blank"><img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=455329&theme=light"
              alt="OpenNotas - The&#0032;best&#0032;personal&#0032;note&#0045;taking&#0032;app&#0044;&#0032;fast&#0044;&#0032;secure&#0032;&#0038;&#0032;free | Product Hunt"
              style="width: 250px; height: 54px;" width="250" height="54" /></a>
        </div>

        <div>
          <h1 class="mb-5 text-5xl font-bold text-base-content">{{ $t('app_name') }}</h1>
          <p class="mb-5">{{ $t('landing.slogan') }}</p>
          <div class="flex justify-center items-center">
            <a id="install-btn" class="install-btn btn btn-primary">
              <PWA />
              {{ $t('landing.install_app') }}
            </a>

            <span class="mx-4 hidden lg:block">Or</span>

            <a href="/app" target="_blank" id="install-btn" class="btn btn-outline hidden lg:flex">
              <Globe />
              {{ $t('landing.try_web_version') }}
            </a>
          </div>
          <p class="mt-4 text-xs">{{ $t('landing.accept_terms') }}
            <br />
            <a class="text-xs underline" href="/service#terms">{{ $t('landing.footer_agreement_terms') }}</a>
          </p>
        </div>

        <svg style="position: absolute; top: 0; left: -48px;" class="svg-float hidden lg:block" height="256" width="256"
          viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M64.5,61.5Q37,73,35,46.5Q33,20,62.5,35Q92,50,64.5,61.5Z" stroke="none" stroke-width="0"
            fill="#4F46E5"></path>
        </svg>

        <svg style="position: absolute; top: 100; right: -48px;" class="svg-float hidden lg:block" height="256"
          width="256" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M56.5,68.5Q29,87,30.5,53Q32,19,58,34.5Q84,50,56.5,68.5Z" stroke="none" stroke-width="0"
            fill="#4F46E5"></path>
        </svg>
      </div>

      <div class="app-thumbnail" style="bottom: 0;">
        <img :src="'/img/opennotas.webp'" alt="OpenNotas Thumbnail" />
      </div>
    </div>

    <div id="feature" class="feature lg:mt-24 lg:h-screen lg:flex lg:items-center">
      <div class="px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="card bg-primary text-primary-content border rounded hover:scale-105 duration-300">
          <div class="card-body">
            <Simple class="w-12 h-12" />
            <h2 class="card-title">{{ $t('landing.feature_simple') }}</h2>
            <p class="mt-2">{{ $t('landing.feature_simple_desc') }}</p>
          </div>
        </div>
        <div class="card border border-primary rounded hover:scale-105 duration-300">
          <div class="card-body">
            <Platform class="w-12 h-12" />
            <h2 class="card-title">{{ $t('landing.feature_multi_platform') }}</h2>
            <p class="mt-2">{{ $t('landing.feature_multi_platform_desc') }}</p>
          </div>
        </div>
        <div class="card border border-primary rounded hover:scale-105 duration-300">
          <div class="card-body">
            <Sync class="w-12 h-12" />
            <h2 class="card-title">{{ $t('landing.feature_sync') }}</h2>
            <p class="mt-2">{{ $t('landing.feature_sync_desc') }}</p>
          </div>
        </div>
        <div class="card bg-primary text-primary-content border rounded hover:scale-105 duration-300">
          <div class="card-body">
            <Security class="w-12 h-12" />
            <h2 class="card-title">{{ $t('landing.feature_e2e') }}</h2>
            <p class="mt-2">{{ $t('landing.feature_e2e_desc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div id="signature" class="signature">
      <div class="px-4 lg:px-0 mt-16 lg:mt-24">
        <div class="grid lg:grid-cols-5 lg:grid-rows-1 lg:gap-16">
          <div class="lg:col-span-2">
            <h2 class="text-3xl font-bold">{{ $t('landing.signature_easy') }}</h2>
            <p class="mt-4">{{ $t('landing.signature_easy_desc') }}</p>
          </div>
          <div class="lg:col-span-3 lg:col-start-3 mt-4 lg:mt-0">
            <img :src="'/img/opennotas.webp'" alt="Feature 1" />
          </div>
        </div>
      </div>

      <div class="px-4 lg:px-0 mt-16 lg:mt-24">
        <div class="grid lg:grid-cols-5 lg:grid-rows-1 lg:gap-16">
          <div class="lg:col-span-3 order-2 lg:order-none mt-4 lg:mt-0">
            <img :src="'/img/multi-platform.png'" class="rounded-lg" alt="Feature 1" />
          </div>
          <div class="lg:col-span-2 lg:col-start-4 order-1 lg:order-none">
            <h2 class="text-3xl font-bold">{{ $t('landing.signature_multi_platform') }}</h2>
            <p class="mt-4">{{ $t('landing.signature_multi_platform_desc') }}</p>
          </div>
        </div>
      </div>

      <div class="px-4 lg:px-0 mt-16 lg:mt-24">
        <div class="grid lg:grid-cols-5 lg:grid-rows-1 lg:gap-16">
          <div class="lg:col-span-2">
            <h2 class="text-3xl font-bold">{{ $t('landing.signature_sync') }}</h2>
            <p class="mt-4">{{ $t('landing.signature_sync_desc') }}</p>
            <p class="mt-2">
              <a class="link" href="https://docs.opennotas.io/advanced/sync-flow" target="_blank">
                {{ $t('landing.read_more') }} »
              </a>
            </p>
          </div>
          <div class="lg:col-span-3 lg:col-start-3 mt-4 lg:mt-0">
            <img :src="'/img/sync.png'" alt="Feature 1" />
          </div>
        </div>
      </div>

      <div class="px-4 lg:px-0 mt-16 lg:mt-24">
        <div class="grid lg:grid-cols-5 lg:grid-rows-1 lg:gap-16">
          <div class="lg:col-span-3 order-2 lg:order-none mt-4 lg:mt-0">
            <img :src="'/img/e2e.jpg'" class="rounded-lg" alt="Feature 1" />
          </div>
          <div class="lg:col-span-2 lg:col-start-4 order-1 lg:order-none">
            <h2 class="text-3xl font-bold">{{ $t('landing.signature_e2e') }}</h2>
            <p class="mt-4">{{ $t('landing.signature_e2e_desc') }}</p>
            <p class="mt-2">
              <a class="link" href="https://docs.opennotas.io/advanced/security" target="_blank">
                {{ $t('landing.read_more') }} »
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div id="faq" class="faq mx-4 lg:mx-0 mt-24">
      <h2 class="text-3xl font-bold text-center">{{ $t('landing.faqs_title') }}</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div tabindex="0" class="collapse collapse-arrow border rounded">
          <input type="checkbox" />
          <div class="collapse-title font-semibold">
            {{ $t('landing.faqs_question_1') }}
          </div>
          <div class="collapse-content">
            <p>{{ $t('landing.faqs_answer_1') }}</p>
          </div>
        </div>

        <div tabindex="1" class="collapse collapse-arrow border rounded">
          <input type="checkbox" />
          <div class="collapse-title font-semibold">
            {{ $t('landing.faqs_question_2') }}
          </div>
          <div class="collapse-content">
            <p>{{ $t('landing.faqs_answer_2') }}</p>
          </div>
        </div>

        <div tabindex="2" class="collapse collapse-arrow border rounded">
          <input type="checkbox" />
          <div class="collapse-title font-semibold">
            {{ $t('landing.faqs_question_3') }}
          </div>
          <div class="collapse-content">
            <p>{{ $t('landing.faqs_answer_3') }}</p>
          </div>
        </div>

        <div tabindex="3" class="collapse collapse-arrow border rounded">
          <input type="checkbox" />
          <div class="collapse-title font-semibold">
            {{ $t('landing.faqs_question_4') }}
          </div>
          <div class="collapse-content">
            <p>{{ $t('landing.faqs_answer_4') }}</p>
          </div>
        </div>

        <div tabindex="4" class="collapse collapse-arrow border rounded">
          <input type="checkbox" />
          <div class="collapse-title font-semibold">
            {{ $t('landing.faqs_question_5') }}
          </div>
          <div class="collapse-content">
            <p>{{ $t('landing.faqs_answer_5') }}</p>
          </div>
        </div>

        <div tabindex="5" class="collapse collapse-arrow border rounded">
          <input type="checkbox" />
          <div class="collapse-title font-semibold">
            {{ $t('landing.faqs_question_6') }}
          </div>
          <div class="collapse-content">
            <p>{{ $t('landing.faqs_answer_6') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="download-now mx-4 lg:mx-0 mt-24">
      <div class="text-center">
        <p class="text-3xl font-bold">{{ $t('landing.start_using') }}</p>
        <p class="text-base-content mt-4">{{ $t('landing.start_using_slogan') }}</p>
        <a class="install-btn btn btn-primary mt-8">
          <PWA />
          {{ $t('landing.install_app') }}
        </a>
      </div>
    </div>
  </div>

  <footer class="footer p-4 lg:p-10 bg-base-200 text-base-content mt-24">
    <aside class="max-w-sm">
      <img :src="'/logo-icon.png'" width="72" height="72" alt="OpenNotas Logo">
      <p class="font-bold text-xl">{{ $t('app_name') }}</p>
      <p>{{ $t('landing.slogan') }}</p>
    </aside>
    <nav>
      <h6 class="footer-title">{{ $t('landing.footer_page_title') }}</h6>
      <a class="link link-hover" href="https://github.com/tonghoai/opennotas" target="_blank">
        {{ $t('landing.footer_page_github') }}
      </a>
      <a class="link link-hover" @click="scrollToHome">{{ $t('landing.footer_page_intro') }}</a>
      <a class="link link-hover" href="https://docs.opennotas.io" target="_blank">
        {{ $t('landing.footer_page_document') }}
      </a>
    </nav>
    <nav>
      <h6 class="footer-title">{{ $t('landing.footer_information_title') }}</h6>
      <a class="link link-hover" href="#">{{ $t('landing.footer_information_about') }}</a>
      <a class="link link-hover" href="#">
        {{ $t('landing.footer_information_contact') }}
      </a>
      <a class="link link-hover" href="https://docs.opennotas.io/community" target="_blank">
        {{ $t('landing.footer_information_community') }}
      </a>
    </nav>
    <nav>
      <h6 class="footer-title">{{ $t('landing.footer_agreement_title') }}</h6>
      <a class="link link-hover" href="/service#terms">{{ $t('landing.footer_agreement_terms') }}</a>
      <a class="link link-hover" href="/service#privacy-policy">{{ $t('landing.footer_agreement_privacy') }}</a>
      <a class="link link-hover" href="/services#cookie-policy">{{ $t('landing.footer_agreement_cookie') }}</a>
    </nav>
  </footer>
</template>

<style lang="scss">
.menu :where(li ul):before {
  width: 0;
}
</style>
