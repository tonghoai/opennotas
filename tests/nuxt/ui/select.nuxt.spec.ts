// @vitest-environment nuxt
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { defineComponent } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import UiSelect from '~/components/ui/select/index.vue';

const options = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

describe('UiSelect', () => {
  it('renders the selected label and listbox trigger semantics', async () => {
    const wrapper = await mountSuspended(UiSelect, {
      props: { modelValue: 'light', options },
    });
    const trigger = wrapper.get('button');
    expect(trigger.text()).toContain('Light');
    expect(trigger.attributes('aria-haspopup')).toBe('listbox');
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(trigger.attributes('aria-controls')).toBeTruthy();
  });

  it('opens, marks the selected option and emits a string value', async () => {
    const wrapper = await mountSuspended(UiSelect, {
      props: { modelValue: 'light', options },
    });
    await wrapper.get('button').trigger('click');
    await nextTick();

    const trigger = wrapper.get('button');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.attributes('aria-activedescendant')).toContain('option-1');

    const listbox = document.querySelector('[role="listbox"]')!;
    expect(listbox).toBeTruthy();
    const optionElements = listbox.querySelectorAll('[role="option"]');
    expect(optionElements).toHaveLength(3);
    expect(optionElements[1].getAttribute('aria-selected')).toBe('true');
    expect(optionElements[1].getAttribute('data-active')).toBe('true');

    (optionElements[2] as HTMLElement).click();
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['dark']);
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('supports keyboard navigation, selection and Escape', async () => {
    const wrapper = await mountSuspended(UiSelect, {
      props: { options },
    });
    const trigger = wrapper.get('button');

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(trigger.attributes('aria-activedescendant')).toContain('option-0');

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(trigger.attributes('aria-activedescendant')).toContain('option-1');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(trigger.attributes('aria-activedescendant')).toContain('option-2');
    await trigger.trigger('keydown', { key: 'ArrowUp' });
    await nextTick();
    expect(trigger.attributes('aria-activedescendant')).toContain('option-1');

    await trigger.trigger('keydown', { key: 'Enter' });
    await nextTick();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['light']);
    expect(trigger.attributes('aria-expanded')).toBe('false');

    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    await trigger.trigger('keydown', { key: 'Escape' });
    await nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('false');
  });

  it('supports Home and End while open', async () => {
    const wrapper = await mountSuspended(UiSelect, { props: { options } });
    const trigger = wrapper.get('button');
    await trigger.trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    await trigger.trigger('keydown', { key: 'End' });
    await nextTick();
    expect(trigger.attributes('aria-activedescendant')).toContain('option-2');
    await trigger.trigger('keydown', { key: 'Home' });
    await nextTick();
    expect(trigger.attributes('aria-activedescendant')).toContain('option-0');
  });

  it('closes on outside pointer down, Tab and other select openings', async () => {
    const wrapper = await mountSuspended(UiSelect, { props: { options } });
    const trigger = wrapper.get('button');

    await trigger.trigger('click');
    await nextTick();
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('false');

    await trigger.trigger('click');
    await nextTick();
    await trigger.trigger('keydown', { key: 'Tab' });
    await nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('false');

    await trigger.trigger('click');
    await nextTick();
    document.dispatchEvent(new CustomEvent('ui-select-open', { detail: 'another-select' }));
    await nextTick();
    expect(trigger.attributes('aria-expanded')).toBe('false');
  });

  it('does not open when disabled or empty, and handles a missing option list', async () => {
    const disabled = await mountSuspended(UiSelect, {
      props: { options, disabled: true },
    });
    await disabled.get('button').trigger('click');
    expect(disabled.get('button').attributes('aria-expanded')).toBe('false');
    disabled.unmount();

    const empty = await mountSuspended(UiSelect, { props: { options: [] } });
    await empty.get('button').trigger('click');
    await nextTick();
    expect(empty.get('button').attributes('aria-expanded')).toBe('true');
    expect(empty.get('button').text()).toContain('Select…');
    const listboxId = empty.get('button').attributes('aria-controls')!;
    expect(document.getElementById(listboxId)?.textContent).toContain('No options');

    await empty.get('button').trigger('keydown', { key: 'Enter' });
    await nextTick();
    expect(empty.emitted('update:modelValue')).toBeUndefined();
  });

  it('teleports the panel into an owning dialog', async () => {
    const Host = defineComponent({
      components: { UiSelect },
      template: '<dialog><UiSelect :options="options" model-value="system" /></dialog>',
      setup: () => ({ options }),
    });
    const wrapper = await mountSuspended(Host);
    const dialog = wrapper.get('dialog').element;
    const trigger = wrapper.get('button');

    await trigger.trigger('click');
    await nextTick();
    expect(dialog.querySelector('[role="listbox"]')).toBeTruthy();
    expect(document.body.querySelector('[role="listbox"]')).toBeNull();
  });
});
