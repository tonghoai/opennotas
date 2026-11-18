// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import UiNotification from '~/components/ui/notification/index.vue';
import UiConfirmHost from '~/components/ui/confirm-host/index.vue';
import AppToast from '~/components/AppToast.vue';
import { useConfirm, useConfirmHost } from '~/composables/useConfirm';
import { dismiss, showActionToast, showInfo, useToast } from '~/composables/useToast';

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));

const global = { mocks: { $t: (key: string) => key } };

afterEach(() => {
  const host = useConfirmHost();
  if (host.current.value) host.cancel();
  useToast().toasts.value.forEach((toast) => dismiss(toast.id));
  document.body.innerHTML = '';
});

describe('UiNotification', () => {
  it.each([
    ['info', 'text-info'],
    ['success', 'text-success'],
    ['warning', 'text-warning'],
    ['error', 'text-danger'],
  ])('renders %s variant', async (variant, colorClass) => {
    const wrapper = await mountSuspended(UiNotification, {
      props: { variant: variant as any, message: `${variant} message` },
      global,
    });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.text()).toContain(`${variant} message`);
    expect(wrapper.find('svg').classes()).toContain(colorClass);
  });

  it('emits dismiss and action events', async () => {
    const wrapper = await mountSuspended(UiNotification, {
      props: { message: 'Saved', actionLabel: 'Undo', dismissLabel: 'Close' },
      global,
    });
    await wrapper.get('button:first-of-type').trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);

    const close = wrapper.get('[aria-label="Close"]');
    await close.trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('can hide the close button', async () => {
    const wrapper = await mountSuspended(UiNotification, {
      props: { message: 'Permanent', closable: false },
      global,
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });
});

describe('AppToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the toast stack and dismisses a toast', async () => {
    const wrapper = await mountSuspended(AppToast, { global });
    showInfo('Hello toast', 10_000);
    await nextTick();

    const message = document.body.textContent;
    expect(message).toContain('Hello toast');
    expect(document.querySelector('.app-toast')).toBeTruthy();

    const button = document.querySelector('.app-toast [aria-label="app.action_close"]') as HTMLElement;
    button.click();
    await nextTick();
    expect(document.body.textContent).not.toContain('Hello toast');
    wrapper.unmount();
  });

  it('runs toast actions', async () => {
    const run = vi.fn();
    const wrapper = await mountSuspended(AppToast, { global });
    showActionToast('Deleted note', 'Undo', run, 10_000);
    await nextTick();

    const action = [...document.querySelectorAll('.app-toast button')]
      .find((button) => button.textContent?.trim() === 'Undo') as HTMLElement;
    action.click();
    await nextTick();
    expect(run).toHaveBeenCalledOnce();
    wrapper.unmount();
  });
});

describe('UiConfirmHost', () => {
  it('renders nothing when there is no active confirmation', async () => {
    const wrapper = await mountSuspended(UiConfirmHost, { global });
    expect(document.querySelector('dialog')).toBeNull();
    wrapper.unmount();
  });
});
