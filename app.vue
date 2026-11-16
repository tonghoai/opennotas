<script lang="ts" setup>
import { closeDialogAnimated } from '~/utils/dialog-motion';

const runtimeConfig = useRuntimeConfig();
const { $i18n } = useNuxtApp();
const colorMode = useColorMode();

const htmlLang = computed(() => {
  const current = ($i18n as any)?.locale;
  const locale = typeof current === 'string' ? current : current?.value;
  return locale === 'zhtw' ? 'zh-TW' : locale || 'en';
});

// Match browser/PWA chrome to the mobile titlebar surface (--ui-card).
// color-scheme is updated as well: Android/Chrome uses it for UA surfaces
// (form controls and, where supported, the system navigation bar) so the
// app theme and the OS chrome do not end up on opposite sides.
const syncThemeColor = () => {
  if (!import.meta.client) return;

  const resolvedScheme = colorMode.value === 'dark' ? 'dark' : 'light';
  document.documentElement.style.colorScheme = resolvedScheme;
  document.querySelectorAll('meta[name="color-scheme"]').forEach((meta) => {
    meta.setAttribute('content', resolvedScheme);
  });

  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue('--ui-card')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map(Number);

  const color = channels.length === 3 && channels.every(Number.isFinite)
    ? `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
    : (colorMode.value === 'dark' ? '#171614' : '#ffffff');

  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', color);
  });
};

useHead(() => ({
  htmlAttrs: {
    lang: htmlLang.value,
  },
  meta: [
    {
      name: 'color-scheme',
      content: colorMode.value === 'dark' ? 'dark' : 'light',
    },
    {
      name: 'theme-color',
      content: colorMode.value === 'dark' ? '#171614' : '#ffffff',
    },
  ],
}));

const handleDialogSubmit = (event: Event) => {
  const form = event.target as HTMLFormElement | null;
  if (!form || form.method !== 'dialog') return;
  const dialog = form.closest('dialog.ui-modal') as HTMLDialogElement | null;
  if (!dialog?.open || dialog.hasAttribute('data-ui-dialog')) return;
  event.preventDefault();
  closeDialogAnimated(dialog);
};

// Native dialogs close instantly on Escape and form submit. Intercept those
// paths for the standalone modal components, whose exit transition otherwise
// never gets a chance to run.
const handleDialogCancel = (event: Event) => {
  const dialog = event.target as HTMLDialogElement | null;
  if (!dialog || dialog.tagName !== 'DIALOG' || !dialog.classList.contains('ui-modal')) return;
  if (dialog.hasAttribute('data-ui-dialog')) return;
  event.preventDefault();
  closeDialogAnimated(dialog);
};

onMounted(() => {
  syncThemeColor();
  document.addEventListener('submit', handleDialogSubmit, true);
  document.addEventListener('cancel', handleDialogCancel, true);

  if (runtimeConfig.public.env === 'production') {
    setTimeout(() => {
      addGtagScript(runtimeConfig.public.ga);
    }, 3000);
  }
});

watch(() => [colorMode.preference, colorMode.value], () => {
  // Wait for color-mode to write data-theme to <html> before reading tokens.
  requestAnimationFrame(syncThemeColor);
});

onBeforeUnmount(() => {
  document.removeEventListener('submit', handleDialogSubmit, true);
  document.removeEventListener('cancel', handleDialogCancel, true);
});
</script>

<template>
  <NuxtPage />
  <AppToast />
  <UiConfirmHost />
</template>
