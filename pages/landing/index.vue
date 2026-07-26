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
  title: 'OpenNotas - A Simple, Lightweight, Cross-Platform Personal Note-Taking Application',
  // Force the landing page to always render in light theme.
  // Rendered server-side so the very first paint already uses light, avoiding any
  // dark->light flash caused by @nuxtjs/color-mode reading a stored "dark" preference.
  htmlAttrs: {
    'data-theme': 'light',
    style: 'color-scheme: light',
  },
  meta: [
    {
      name: 'color-scheme',
      content: 'light',
    },
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
      content: 'OpenNotas - A Simple, Lightweight, Cross-Platform Personal Note-Taking Application',
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
      content: 'OpenNotas - A Simple, Lightweight, Cross-Platform Personal Note-Taking Application',
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
  script: [
    {
      // Runs synchronously during HTML parse, BEFORE the @nuxtjs/color-mode
      // inline script. We park any stored "dark" preference into
      // sessionStorage, then force the active preference to "light" for this
      // route. The downstream color-mode script therefore also resolves to
      // "light" and the very first paint is light — no dark->light flash.
      // `tagPriority` is set very low so this tag is emitted before the
      // color-mode script in <head>.
      tagPriority: -100,
      innerHTML: `;(function(){try{var p=location.pathname;if(p==='/'||p===''||p.indexOf('/landing')===0){var k='nuxt-color-mode';var s=localStorage.getItem(k);if(s&&s!=='light'){try{sessionStorage.setItem('__landing_saved_theme',s);}catch(_){}try{localStorage.setItem(k,'light');}catch(_){}}var d=document.documentElement;d.setAttribute('data-theme','light');d.style.colorScheme='light';}}catch(_){}})();`,
    },
  ],
});

const { setLocale } = useI18n();

const restoreThemePreference = () => {
  try {
    const saved = sessionStorage.getItem('__landing_saved_theme');
    if (saved !== null) {
      localStorage.setItem('nuxt-color-mode', saved);
      sessionStorage.removeItem('__landing_saved_theme');
    }
  } catch (_) {
    // ignore storage access failures (private mode, disabled storage, etc.)
  }
};

onMounted(() => {
  // Defense-in-depth: re-assert light theme once mounted in case any other
  // global plugin/reactor changed it. Kept synchronous (no setTimeout) to
  // avoid a visible dark->light flicker.
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.style.colorScheme = 'light';
  // Restore any parked "dark" preference so a subsequent hard-refresh on /app
  // (or another page) still honours the user's theme choice. We do this via
  // localStorage directly, not $colorMode, so the color-mode module does not
  // re-apply dark while the user is still on this (light-only) landing page.
  restoreThemePreference();
  // add overflow auto to body
  document.body.style.overflow = 'auto';
});

onBeforeUnmount(() => {
  // Also restore on client-side navigation away from the landing page.
  restoreThemePreference();
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

  window.addEventListener('appinstalled', (event) => {
    if (window.location.pathname !== '/app') {
      window.location.href = '/app';
    }
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
  <div class="landing-page">
    <div class="landing max-w-screen-lg mx-auto px-4 lg:px-2">
      <!-- Navigation -->
      <div id="home" class="navbar py-4">
        <div class="flex-1 gap-2.5 items-center">
          <img :src="'/logo-icon.png'" width="36" height="36" alt="OpenNotas Logo" class="rounded-lg">
          <span class="font-semibold text-base tracking-tight">{{ $t('app_name') }}</span>
        </div>
        <div class="flex-none hidden lg:flex">
          <ul class="menu flex-row items-center menu-horizontal px-1 gap-1">
            <li @click="scrollToHome"><a>{{ $t('landing.navbar_home') }}</a></li>
            <li @click="scrollToFeature"><a>{{ $t('landing.navbar_feature') }}</a></li>
            <li @click="scrollToSignature"><a>{{ $t('landing.navbar_signature') }}</a></li>
            <li><a href="https://docs.opennotas.io" target="_blank" rel="noopener noreferrer">{{
              $t('landing.navbar_document') }}</a></li>
            <li @click="scrollToFaq"><a>{{ $t('landing.navbar_faqs') }}</a></li>
            <li>
              <div class="dropdown p-0">
                <div tabindex="0" role="button" class="btn btn-sm btn-ghost btn-square">
                  <Language />
                </div>
                <ul tabindex="0"
                  class="dropdown-content z-[1] menu p-2 border border-base-300 rounded-box w-36 shadow-sm"
                  style="top: 42px; left: 0">
                  <li @click="setLocale('vi')"><a>{{ $t('vi') }}</a></li>
                  <li @click="setLocale('en')"><a>{{ $t('en') }}</a></li>
                  <li @click="setLocale('ru')"><a>{{ $t('ru') }}</a></li>
                  <li @click="setLocale('zhtw')"><a>{{ $t('zhtw') }}</a></li>
                </ul>
              </div>
            </li>
            <li><a class="install-btn btn btn-sm btn-sm btn-primary ml-2 rounded-md px-5">{{ $t('landing.install_app')
                }}</a></li>
          </ul>
        </div>
      </div>

      <!-- Hero -->
      <section class="relative overflow-hidden min-h-[calc(100vh_-_90px)] flex flex-col justify-evenly">
        <!-- Soft decorative accents -->
        <div aria-hidden="true"
          class="svg-float pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-md blur-3xl hidden lg:block"
          style="background: oklch(0.55 0.12 250 / 0.10);"></div>
        <div aria-hidden="true"
          class="svg-float pointer-events-none absolute top-24 -right-24 h-80 w-80 rounded-md blur-3xl hidden lg:block"
          style="background: oklch(0.65 0.12 20 / 0.08);"></div>

        <div class="relative text-center pt-10 lg:pt-14">
          <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-16">
            <a class="flex justify-center md:justify-end"
              href="https://www.producthunt.com/posts/opennotas?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-opennotas"
              target="_blank" rel="noopener noreferrer"><img
                src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=455329&theme=light&period=daily"
                alt="OpenNotas - The&#0032;best&#0032;personal&#0032;note&#0045;taking&#0032;app&#0044;&#0032;fast&#0044;&#0032;secure&#0032;&#0038;&#0032;free | Product Hunt"
                style="width: 250px; height: 54px;" width="250" height="54" /></a>

            <a class="flex justify-center md:justify-start"
              href="https://www.producthunt.com/posts/opennotas?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-opennotas"
              target="_blank" rel="noopener noreferrer"><img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=455329&theme=light"
                alt="OpenNotas - The&#0032;best&#0032;personal&#0032;note&#0045;taking&#0032;app&#0044;&#0032;fast&#0044;&#0032;secure&#0032;&#0038;&#0032;free | Product Hunt"
                style="width: 250px; height: 54px;" width="250" height="54" /></a>
          </div> -->

          <div class="mx-auto max-w-2xl">
            <span class="eyebrow">{{ $t('app_name') }}</span>
            <h1
              class="mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-base-content leading-snug">
              {{ $t('landing.slogan') }}
            </h1>
            <p class="hero-tagline mt-4">
              {{ $t('landing.hero_tagline') }}
            </p>
            <div class="mt-7 flex flex-wrap justify-center items-center gap-3">
              <a class="install-btn btn btn-sm btn-primary rounded-md px-5">
                <PWA />
                {{ $t('landing.install_app') }}
              </a>

              <span class="hidden lg:block text-xs text-base-content/40">·</span>

              <a href="/app" target="_blank" rel="noopener noreferrer"
                class="install-btn btn btn-sm btn-outline rounded-md px-5 hidden lg:flex bg-base-100">
                <Globe />
                {{ $t('landing.try_web_version') }}
              </a>
            </div>
            <p class="mt-6 text-xs text-base-content/55">
              {{ $t('landing.accept_terms') }}
              <a class="link link-hover underline-offset-2 text-sm font-semibold text-base-content"
                href="/service#terms">{{ $t('landing.footer_agreement_terms') }}</a>
            </p>
          </div>
        </div>

        <div class="app-thumbnail relative" style="bottom: 0;">
          <img :src="'/img/opennotas-3.webp'" alt="OpenNotas Thumbnail" />
        </div>
      </section>

      <!-- Features -->
      <section id="feature" class="feature py-12 lg:py-16 scroll-mt-20">
        <div class="text-center max-w-2xl mx-auto mb-10">
          <span class="eyebrow">{{ $t('landing.feature_title') }}</span>
          <h2 class="section-title">{{ $t('landing.feature_title') }}</h2>
          <p class="section-sub">{{ $t('landing.feature_sub') }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article class="feature-card">
            <div class="feature-icon">
              <Simple class="w-5 h-5" />
            </div>
            <h3 class="feature-title">{{ $t('landing.feature_simple') }}</h3>
            <p class="feature-desc">{{ $t('landing.feature_simple_desc') }}</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon">
              <Platform class="w-5 h-5" />
            </div>
            <h3 class="feature-title">{{ $t('landing.feature_multi_platform') }}</h3>
            <p class="feature-desc">{{ $t('landing.feature_multi_platform_desc') }}</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon">
              <Sync class="w-5 h-5" />
            </div>
            <h3 class="feature-title">{{ $t('landing.feature_sync') }}</h3>
            <p class="feature-desc">{{ $t('landing.feature_sync_desc') }}</p>
          </article>

          <article class="feature-card">
            <div class="feature-icon">
              <Security class="w-5 h-5" />
            </div>
            <h3 class="feature-title">{{ $t('landing.feature_e2e') }}</h3>
            <p class="feature-desc">{{ $t('landing.feature_e2e_desc') }}</p>
          </article>
        </div>
      </section>

      <!-- Highlights / Signature -->
      <section id="signature" class="signature py-12 lg:py-16 scroll-mt-20">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <span class="eyebrow">{{ $t('landing.signature_title') }}</span>
          <h2 class="section-title">{{ $t('landing.signature_title') }}</h2>
          <p class="section-sub">{{ $t('landing.signature_sub') }}</p>
        </div>

        <div class="space-y-14 lg:space-y-20">
          <!-- highlight 1 -->
          <div class="grid lg:grid-cols-5 lg:gap-16 items-center">
            <div class="lg:col-span-2">
              <span class="signature-index">01</span>
              <h3 class="signature-title">{{ $t('landing.signature_easy') }}</h3>
              <p class="signature-desc">{{ $t('landing.signature_easy_desc') }}</p>
              <p class="signature-extra">{{ $t('landing.signature_easy_extra') }}</p>
            </div>
            <div class="lg:col-span-3 mt-5 lg:mt-0 flex justify-center">
              <img class="w-48 lg:w-56" :src="'/img/unicorn.svg'" alt="" />
            </div>
          </div>

          <!-- highlight 2 -->
          <div class="grid lg:grid-cols-5 lg:gap-16 items-center">
            <div class="lg:col-span-3 order-2 lg:order-none flex justify-center">
              <img class="w-48 lg:w-56" :src="'/img/tools_pocket_knife_foldable_multitool_skills.svg'" alt="" />
            </div>
            <div class="lg:col-span-2 lg:col-start-4 order-1 lg:order-none">
              <span class="signature-index">02</span>
              <h3 class="signature-title">{{ $t('landing.signature_multi_platform') }}</h3>
              <p class="signature-desc">{{ $t('landing.signature_multi_platform_desc') }}</p>
              <p class="signature-extra">{{ $t('landing.signature_multi_platform_extra') }}</p>
            </div>
          </div>

          <!-- highlight 3 -->
          <div class="grid lg:grid-cols-5 lg:gap-16 items-center">
            <div class="lg:col-span-2">
              <span class="signature-index">03</span>
              <h3 class="signature-title">{{ $t('landing.signature_sync') }}</h3>
              <p class="signature-desc">{{ $t('landing.signature_sync_desc') }}</p>
              <p class="signature-extra">{{ $t('landing.signature_sync_extra') }}</p>
              <a class="signature-link" href="https://docs.opennotas.io/advanced/sync-flow" target="_blank"
                rel="noopener noreferrer">
                {{ $t('landing.read_more') }} →
              </a>
            </div>
            <div class="lg:col-span-3 mt-5 lg:mt-0 flex justify-center">
              <img class="w-36 lg:w-44" :src="'/img/space_rocket-3.svg'" alt="" />
            </div>
          </div>

          <!-- highlight 4 -->
          <div class="grid lg:grid-cols-5 lg:gap-16 items-center">
            <div class="lg:col-span-3 order-2 lg:order-none flex justify-center">
              <img class="w-36 lg:w-44" :src="'/img/finger_print.svg'" alt="" />
            </div>
            <div class="lg:col-span-2 lg:col-start-4 order-1 lg:order-none">
              <span class="signature-index">04</span>
              <h3 class="signature-title">{{ $t('landing.signature_e2e') }}</h3>
              <p class="signature-desc">{{ $t('landing.signature_e2e_desc') }}</p>
              <p class="signature-extra">{{ $t('landing.signature_e2e_extra') }}</p>
              <a class="signature-link" href="https://docs.opennotas.io/advanced/security" target="_blank"
                rel="noopener noreferrer">
                {{ $t('landing.read_more') }} →
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="faq mt-12 lg:mt-16 scroll-mt-20">
        <div class="text-center max-w-2xl mx-auto mb-8">
          <span class="eyebrow">{{ $t('landing.faqs_title') }}</span>
          <h2 class="section-title">{{ $t('landing.faqs_title') }}</h2>
          <p class="section-sub">{{ $t('landing.faq_sub') }}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-4xl mx-auto">
          <div tabindex="0" class="collapse collapse-arrow border border-base-300 rounded-md bg-base-100">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold">
              {{ $t('landing.faqs_question_1') }}
            </div>
            <div class="collapse-content">
              <p class="faq-answer">{{ $t('landing.faqs_answer_1') }}</p>
            </div>
          </div>

          <div tabindex="1" class="collapse collapse-arrow border border-base-300 rounded-md bg-base-100">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold">
              {{ $t('landing.faqs_question_2') }}
            </div>
            <div class="collapse-content">
              <p class="faq-answer">{{ $t('landing.faqs_answer_2') }}</p>
            </div>
          </div>

          <div tabindex="2" class="collapse collapse-arrow border border-base-300 rounded-md bg-base-100">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold">
              {{ $t('landing.faqs_question_3') }}
            </div>
            <div class="collapse-content">
              <p class="faq-answer">{{ $t('landing.faqs_answer_3') }}</p>
            </div>
          </div>

          <div tabindex="3" class="collapse collapse-arrow border border-base-300 rounded-md bg-base-100">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold">
              {{ $t('landing.faqs_question_4') }}
            </div>
            <div class="collapse-content">
              <p class="faq-answer">{{ $t('landing.faqs_answer_4') }}</p>
            </div>
          </div>

          <div tabindex="4" class="collapse collapse-arrow border border-base-300 rounded-md bg-base-100">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold">
              {{ $t('landing.faqs_question_5') }}
            </div>
            <div class="collapse-content">
              <p class="faq-answer">{{ $t('landing.faqs_answer_5') }}</p>
            </div>
          </div>

          <div tabindex="5" class="collapse collapse-arrow border border-base-300 rounded-md bg-base-100">
            <input type="checkbox" />
            <div class="collapse-title text-sm font-semibold">
              {{ $t('landing.faqs_question_6') }}
            </div>
            <div class="collapse-content">
              <p class="faq-answer">{{ $t('landing.faqs_answer_6') }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to action -->
      <section class="download-now mt-16 lg:mt-24">
        <div
          class="relative overflow-hidden rounded-md border border-base-300 bg-gradient-to-b from-base-200/60 to-base-100 px-6 py-14 lg:py-16 text-center">
          <div aria-hidden="true"
            class="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-56 w-56 rounded-md blur-3xl"
            style="background: oklch(0.55 0.12 250 / 0.10);"></div>
          <div class="relative">
            <p class="text-xl lg:text-2xl font-semibold tracking-tight">{{ $t('landing.start_using') }}</p>
            <p class="cta-sub mt-3 mx-auto">{{ $t('landing.start_using_slogan') }}</p>
            <a class="install-btn btn btn-sm btn-primary mt-6 rounded-md px-6">
              <PWA />
              {{ $t('landing.install_app') }}
            </a>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="footer p-6 lg:p-10 bg-base-200 text-base-content mt-16 lg:mt-20 pb-10">
      <div class="max-w-screen-lg w-full mx-auto flex gap-8 flex-col md:flex-row justify-between">
        <aside class="max-w-sm flex flex-col gap-2.5">
          <div class="flex items-center gap-2.5">
            <img :src="'/logo-icon.png'" width="36" height="36" alt="OpenNotas Logo" class="rounded-lg">
            <p class="font-semibold text-base">{{ $t('app_name') }}</p>
          </div>
          <p class="text-sm text-base-content/65">{{ $t('landing.slogan') }}</p>
        </aside>
        <nav class="flex flex-col gap-1.5">
          <h6 class="footer-title opacity-50">{{ $t('landing.footer_page_title') }}</h6>
          <a class="link link-hover" href="https://github.com/tonghoai/opennotas" target="_blank"
            rel="noopener noreferrer">
            {{ $t('landing.footer_page_github') }}
          </a>
          <a class="link link-hover" @click="scrollToHome">{{ $t('landing.footer_page_intro') }}</a>
          <a class="link link-hover" href="https://docs.opennotas.io" target="_blank" rel="noopener noreferrer">
            {{ $t('landing.footer_page_document') }}
          </a>
        </nav>
        <nav class="flex flex-col gap-1.5">
          <h6 class="footer-title opacity-50">{{ $t('landing.footer_information_title') }}</h6>
          <a class="link link-hover" href="#">{{ $t('landing.footer_information_about') }}</a>
          <a class="link link-hover" href="#">
            {{ $t('landing.footer_information_contact') }}
          </a>
          <a class="link link-hover" href="https://docs.opennotas.io/community" target="_blank"
            rel="noopener noreferrer">
            {{ $t('landing.footer_information_community') }}
          </a>
        </nav>
        <nav class="flex flex-col gap-1.5">
          <h6 class="footer-title opacity-50">{{ $t('landing.footer_agreement_title') }}</h6>
          <a class="link link-hover" href="/service#terms">{{ $t('landing.footer_agreement_terms') }}</a>
          <a class="link link-hover" href="/service#privacy-policy">{{ $t('landing.footer_agreement_privacy') }}</a>
          <a class="link link-hover" href="/services#cookie-policy">{{ $t('landing.footer_agreement_cookie') }}</a>
        </nav>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
.menu :where(li ul):before {
  width: 0;
}
</style>

<style lang="scss" scoped>
.landing-page {
  background-color: oklch(var(--b1));
  background-image: radial-gradient(oklch(0 0 0 / 0.035) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: -1px -1px;
}

/* ===== Eyebrow pill ===== */
.eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: oklch(var(--p));
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: oklch(var(--p) / 0.06);
  border: 1px solid oklch(var(--p) / 0.16);
}

/* ===== Hero tagline ===== */
.hero-tagline {
  font-size: 0.95rem;
  line-height: 1.7;
  color: oklch(var(--bc) / 0.6);
  max-width: 32rem;
  margin-left: auto;
  margin-right: auto;
}

/* ===== Section title & sub ===== */
.section-title {
  margin-top: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: oklch(var(--bc));

  @media (min-width: 1024px) {
    font-size: 1.875rem;
  }
}

.section-sub {
  margin-top: 0.65rem;
  font-size: 0.9rem;
  line-height: 1.65;
  color: oklch(var(--bc) / 0.55);
  max-width: 36rem;
  margin-left: auto;
  margin-right: auto;
}

/* ===== Feature cards ===== */
.feature-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid oklch(0 0 0 / 0.07);
  border-radius: 0.875rem;
  background-color: oklch(var(--b1));
  box-shadow: 0 1px 0 oklch(0 0 0 / 0.02);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 32px -22px oklch(0 0 0 / 0.25);
    border-color: oklch(0 0 0 / 0.14);
  }
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background-color: oklch(var(--p));
  color: oklch(var(--pc));
  box-shadow: 0 4px 10px -6px oklch(0 0 0 / 0.3);
}

.feature-title {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: oklch(var(--bc));
}

.feature-desc {
  font-size: 0.85rem;
  line-height: 1.6;
  color: oklch(var(--bc) / 0.62);
}

/* ===== Signature highlights ===== */
.signature-index {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: oklch(var(--p) / 0.65);
  margin-bottom: 0.4rem;
}

.signature-title {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: oklch(var(--bc));

  @media (min-width: 1024px) {
    font-size: 1.75rem;
  }
}

.signature-desc {
  margin-top: 0.85rem;
  font-size: 0.92rem;
  line-height: 1.7;
  color: oklch(var(--bc) / 0.68);
}

.signature-extra {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  line-height: 1.65;
  color: oklch(var(--bc) / 0.48);
}

.signature-link {
  margin-top: 0.85rem;
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  color: oklch(var(--p));
  text-decoration: none;
  transition: opacity 0.18s ease;

  &:hover {
    opacity: 0.7;
  }
}

/* ===== FAQ ===== */
.faq-answer {
  font-size: 0.875rem;
  line-height: 1.7;
  color: oklch(var(--bc) / 0.7);
}

/* ===== CTA ===== */
.cta-sub {
  font-size: 0.9rem;
  line-height: 1.65;
  color: oklch(var(--bc) / 0.62);
  max-width: 30rem;
}

/* ===== App thumbnail ===== */
.app-thumbnail img {
  display: block;
  width: 100%;
  border-radius: 1rem;
  box-shadow: 0 24px 50px -28px oklch(0 0 0 / 0.22);
}

/* ===== Refined navbar menu links (skip buttons) ===== */
:deep(.menu > li > a:not(.btn)):not(.btn-primary) {
  border-radius: 0.5rem;
  font-size: 0.875rem;
  padding: 0.4rem 0.7rem;
  color: oklch(var(--bc) / 0.7);
  transition: background-color 0.18s ease, color 0.18s ease;

  &:hover {
    background-color: oklch(0 0 0 / 0.04);
    color: oklch(var(--bc));
  }
}
</style>
