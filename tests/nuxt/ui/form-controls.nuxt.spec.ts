// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
import UiButton from '~/components/ui/button/index.vue';
import UiInput from '~/components/ui/input/index.vue';
import UiTextarea from '~/components/ui/textarea/index.vue';
import UiCheckbox from '~/components/ui/checkbox/index.vue';
import UiSwitch from '~/components/ui/switch/index.vue';
import UiFormField from '~/components/ui/form-field/index.vue';
import UiAlert from '~/components/ui/alert/index.vue';
import UiBadge from '~/components/ui/badge/index.vue';
import UiSpinner from '~/components/ui/spinner/index.vue';
import UiReorderIcon from '~/components/ui/reorder-icon/index.vue';

describe('UiButton', () => {
  it('renders variants, sizes and defaults', async () => {
    const wrapper = await mountSuspended(UiButton, {
      slots: { default: () => 'Save' },
    });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.classes()).toEqual(['ui-btn']);
    expect(wrapper.text()).toBe('Save');

    const styled = await mountSuspended(UiButton, {
      props: {
        variant: 'danger',
        size: 'lg',
        block: true,
        square: true,
        circle: true,
        outline: true,
      },
      slots: { default: () => 'Delete' },
    });
    expect(styled.classes()).toEqual([
      'ui-btn',
      'ui-btn-danger',
      'ui-btn-lg',
      'ui-btn-block',
      'ui-btn-square',
      'ui-btn-circle',
      'ui-btn-outline',
    ]);
  });

  it('disables while loading and exposes aria-busy', async () => {
    const wrapper = await mountSuspended(UiButton, {
      props: { loading: true },
      slots: { default: () => 'Loading' },
    });
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.find('.ui-loading').exists()).toBe(true);
  });

  it('supports link rendering with aria-disabled instead of disabled', async () => {
    const wrapper = mount(UiButton, {
      props: { as: 'a', disabled: true, type: 'submit' },
      attrs: { href: '/app' },
      slots: { default: () => 'Home' },
    });
    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes('href')).toBe('/app');
    expect(wrapper.attributes('disabled')).toBeUndefined();
    expect(wrapper.attributes('type')).toBeUndefined();
    expect(wrapper.attributes('aria-disabled')).toBe('true');
  });
});

describe('UiInput', () => {
  it('emits updates and exposes focus', async () => {
    const wrapper = mount(UiInput, {
      props: { modelValue: 'hello', size: 'sm', invalid: true },
    });
    document.body.appendChild(wrapper.element);
    const input = wrapper.get('input');
    expect(input.element.value).toBe('hello');
    expect(wrapper.classes()).toContain('ui-input-sm');
    expect(wrapper.attributes('aria-invalid')).toBe('true');

    await input.setValue('world');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['world']);

    (wrapper.vm as any).focus();
    expect(document.activeElement).toBe(input.element);
    wrapper.unmount();
  });

  it('forwards disabled, readonly, type and focus/blur events', async () => {
    const wrapper = mount(UiInput, {
      props: { type: 'email', readonly: true },
    });
    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('email');
    expect(input.attributes('readonly')).toBeDefined();
    await input.trigger('focus');
    await input.trigger('blur');
    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.emitted('blur')).toHaveLength(1);

    const disabled = mount(UiInput, { props: { disabled: true } });
    expect(disabled.get('input').attributes('disabled')).toBeDefined();
  });
});

describe('UiTextarea', () => {
  it('renders rows, invalid state and emits input', async () => {
    const wrapper = await mountSuspended(UiTextarea, {
      props: { modelValue: 'body', rows: 6, invalid: true, size: 'sm' },
    });
    const textarea = wrapper.get('textarea');
    expect(textarea.attributes('rows')).toBe('6');
    expect(textarea.element.value).toBe('body');
    expect(wrapper.classes()).toContain('ui-textarea-sm');
    expect(wrapper.attributes('aria-invalid')).toBe('true');

    await textarea.setValue('updated');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['updated']);
  });
});

describe('UiCheckbox and UiSwitch', () => {
  it('emits checked state and change events', async () => {
    const checkbox = await mountSuspended(UiCheckbox, {
      props: { modelValue: false, size: 'sm' },
    });
    const input = checkbox.get('input');
    expect(input.attributes('type')).toBe('checkbox');
    expect(input.attributes('checked')).toBeUndefined();
    await input.setValue(true);
    expect(checkbox.emitted('update:modelValue')?.[0]).toEqual([true]);
    expect(checkbox.emitted('change')).toHaveLength(1);

    const toggle = await mountSuspended(UiSwitch, { props: { modelValue: true } });
    const toggleInput = toggle.get('input');
    expect(toggleInput.attributes('role')).toBe('switch');
    expect(toggleInput.attributes('checked')).toBeDefined();
    await toggleInput.setValue(false);
    expect(toggle.emitted('update:modelValue')?.[0]).toEqual([false]);
  });
});

describe('UiFormField', () => {
  it('renders label, required marker, hint slot and description', async () => {
    const wrapper = mount(UiFormField, {
      props: { label: 'Title', description: 'Shown in the list', required: true },
      slots: {
        default: () => h('input', { 'aria-label': 'title' }),
        hint: () => h('span', null, 'Hint'),
      },
    });
    expect(wrapper.element.tagName).toBe('LABEL');
    expect(wrapper.text()).toContain('Title');
    expect(wrapper.text()).toContain('*');
    expect(wrapper.text()).toContain('Hint');
    expect(wrapper.text()).toContain('Shown in the list');
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('prefers the error message over the description', async () => {
    const wrapper = mount(UiFormField, {
      props: { label: 'Title', description: 'Helpful', error: 'Required' },
    });
    expect(wrapper.text()).toContain('Required');
    expect(wrapper.text()).not.toContain('Helpful');
  });
});

describe('display primitives', () => {
  it('renders alert variants and actions', async () => {
    const wrapper = await mountSuspended(UiAlert, {
      props: { variant: 'danger', title: 'Danger' },
      slots: { default: () => 'Something happened', actions: () => h('button', null, 'Retry') },
    });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.classes()).toContain('ui-alert-danger');
    expect(wrapper.text()).toContain('Danger');
    expect(wrapper.text()).toContain('Something happened');
    expect(wrapper.find('button').text()).toBe('Retry');
  });

  it('renders badges and spinner labels', async () => {
    const badge = await mountSuspended(UiBadge, {
      props: { variant: 'success', size: 'sm' },
      slots: { default: () => 'Synced' },
    });
    expect(badge.classes()).toEqual(['ui-badge', 'ui-badge-success', 'ui-badge-sm']);
    expect(badge.text()).toBe('Synced');

    const spinner = await mountSuspended(UiSpinner, { props: { size: 'lg', label: 'Saving' } });
    expect(spinner.attributes('role')).toBe('status');
    expect(spinner.attributes('aria-label')).toBe('Saving');
    expect(spinner.classes()).toContain('ui-loading-lg');
  });

  it('renders the reorder glyph', async () => {
    const wrapper = await mountSuspended(UiReorderIcon);
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
  });
});
