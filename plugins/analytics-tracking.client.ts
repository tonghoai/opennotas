export default defineNuxtPlugin(() => {
  const track = (el: HTMLElement) => {
    const eventName = el.dataset.gaEvent;
    if (!eventName) return;
    const value = el.dataset.gaValue;
    trackEvent(eventName, value !== undefined ? { value } : undefined);
  };

  // Text-like inputs are tracked via the keydown(Enter) listener below, not
  // click — clicking one just focuses it, it doesn't confirm anything.
  // Checkboxes/radios are the exception: a click on them *is* the value
  // change, so they're tracked here.
  const isTextlikeInput = (el: HTMLElement) =>
    el.tagName === 'INPUT' && !['checkbox', 'radio'].includes((el as HTMLInputElement).type);

  // Capture phase: several components call @click.stop, which calls
  // stopPropagation() during the bubble phase and would prevent a
  // bubble-phase listener on document from ever seeing the click.
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-ga-event]');
    if (el && !isTextlikeInput(el)) track(el);
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('input[data-ga-event]');
    if (el) track(el);
  }, true);

  // Separate attribute (not data-ga-event) for inputs that commit their value
  // on native 'change' (blur-after-edit) rather than via a Submit/Enter
  // action — using the same attribute here would misfire on plain blur for
  // inputs like folder-rename/tag-form that only confirm via Enter/button.
  document.addEventListener('change', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-ga-event-on-change]');
    const eventName = el?.dataset.gaEventOnChange;
    if (eventName) trackEvent(eventName);
  }, true);

  // Note content editing fires 'input' on every keystroke across all 3
  // editors (Tiptap/CodeMirror/Crepe) — debounce to one event per burst of
  // typing instead of tracking each keystroke.
  const EDITOR_SELECTOR = '#tiptap-editor, #cm-editor, #crepe-editor';
  let editContentTimer: ReturnType<typeof setTimeout> | undefined;
  document.addEventListener('input', (e) => {
    const el = (e.target as HTMLElement)?.closest<HTMLElement>(EDITOR_SELECTOR);
    if (!el) return;
    clearTimeout(editContentTimer);
    editContentTimer = setTimeout(() => trackEvent('note_edit_content'), 1500);
  }, true);
});
