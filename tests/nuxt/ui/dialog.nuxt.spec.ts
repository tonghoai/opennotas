// @vitest-environment nuxt
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import UiDialog from '~/components/ui/dialog/index.vue';

mockNuxtImport('useI18n', () => () => ({ t: (key: string) => key }));

const global = { mocks: { $t: (key: string) => key } };

describe('UiDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders title, description and accessible labelling', async () => {
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Delete note', description: 'This cannot be undone' },
      global,
    });

    const dialog = wrapper.get('dialog');
    expect(dialog.attributes('open')).toBeDefined();
    expect(dialog.attributes('data-ui-dialog')).toBeDefined();
    expect(dialog.attributes('aria-labelledby')).toBeTruthy();
    expect(dialog.attributes('aria-describedby')).toBeTruthy();
    expect(wrapper.text()).toContain('Delete note');
    expect(wrapper.text()).toContain('This cannot be undone');
    expect(wrapper.get('[aria-label="app.action_close"]').exists()).toBe(true);
  });

  it('emits ok and stays open unless closeOnOk is set', async () => {
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Confirm', okText: 'Save' },
      global,
    });

    await wrapper.get('.ui-modal-footer button:last-child').trigger('click');
    expect(wrapper.emitted('ok')).toHaveLength(1);
    expect(wrapper.emitted('update:open')).toBeUndefined();

    const closing = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Confirm', closeOnOk: true },
      global,
    });
    await closing.get('.ui-modal-footer button:last-child').trigger('click');
    expect(closing.emitted('ok')).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(220);
    expect(closing.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('delays close events for the exit animation and fires cancel once', async () => {
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Cancel me' },
      global,
    });

    await wrapper.get('.ui-modal-footer button:first-child').trigger('click');
    expect(wrapper.emitted('cancel')).toBeUndefined();
    expect(wrapper.emitted('close')).toBeUndefined();
    expect(wrapper.get('dialog').classes()).toContain('is-closing');

    await vi.advanceTimersByTimeAsync(219);
    expect(wrapper.emitted('cancel')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('after-close')).toHaveLength(1);
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('supports the mobile back button in the header', async () => {
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Palette', back: true },
      global,
    });

    const back = wrapper.get('.ui-modal-back');
    expect(back.attributes('aria-label')).toBe('app.action_back');
    await back.trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
  });

  it('closes on backdrop click but respects overlayClosable and loading', async () => {
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Backdrop' },
      global,
    });
    await wrapper.get('dialog').trigger('click');
    await vi.advanceTimersByTimeAsync(220);
    expect(wrapper.emitted('cancel')).toHaveLength(1);

    const locked = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Locked', overlayClosable: false },
      global,
    });
    await locked.get('dialog').trigger('click');
    await vi.advanceTimersByTimeAsync(220);
    expect(locked.emitted('cancel')).toBeUndefined();

    const loading = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Saving', loading: true },
      global,
    });
    expect(loading.get('.ui-modal-footer button:first-child').attributes('disabled')).toBeDefined();
    expect(loading.get('.ui-modal-footer button:last-child').attributes('disabled')).toBeDefined();
    await loading.get('dialog').trigger('click');
    await vi.advanceTimersByTimeAsync(220);
    expect(loading.emitted('cancel')).toBeUndefined();
  });

  it('prevents cancel while loading and ignores repeated close requests', async () => {
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Loading', loading: true },
      global,
    });
    await wrapper.get('dialog').trigger('cancel');
    expect(wrapper.emitted('cancel')).toBeUndefined();

    const normal = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Close' },
      global,
    });
    await normal.get('.ui-modal-close').trigger('click');
    await normal.get('.ui-modal-footer button:first-child').trigger('click');
    await vi.advanceTimersByTimeAsync(220);
    expect(normal.emitted('cancel')).toHaveLength(1);
    expect(normal.emitted('close')).toHaveLength(1);
  });

  it('closes immediately under prefers-reduced-motion', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    const wrapper = await mountSuspended(UiDialog, {
      props: { open: true, title: 'Reduced' },
      global,
    });
    await wrapper.get('.ui-modal-close').trigger('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.get('dialog').classes()).not.toContain('is-closing');
  });
});
