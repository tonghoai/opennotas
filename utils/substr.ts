import { getNoteExcerpt, getNoteTitle } from './note-content';

// Backwards-compatible helpers. Keep the old names because note-history,
// sync and older call sites import them, but route them through the shared
// Markdown/plain-text pipeline so titles and excerpts agree everywhere.
const substrTitle = (str: string) => {
  return getNoteTitle(str);
}

const substrContent = (str: string) => {
  return getNoteExcerpt(str, 60);
}

export {
  substrTitle,
  substrContent,
}
