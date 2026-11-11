/**
 * One plain-text pipeline for everything the UI shows *about* a note:
 * list title, list excerpt, in-note search snippets, word/character counts.
 *
 * Notes are stored as Markdown (Crepe/FlexSearch) or HTML-ish Markdown with
 * `<br />` line breaks. Deriving these values in four different places caused
 * titles, excerpts and counts to disagree, so keep it here.
 */

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
  nbsp: ' ',
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();
    if (key.startsWith('#x')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return HTML_ENTITIES[key] ?? match;
  });
}

function stripInlineMarkdown(line: string): string {
  return line
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\\([\\`*_[\](){}#+.!|>~-])/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/^\s*(?:[-*+]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s+)/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*([-*_])\s*(?:\1\s*){2,}$/, '')
    .replace(/(?:\*\*|__|\*|_|~~)/g, '')
    .replace(/\|/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Markdown/HTML -> readable text. Blank lines are preserved so callers can
 * pick the first meaningful line (title) and the next one (excerpt).
 */
function getNotePlainText(content: string | undefined | null): string {
  if (!content) return '';

  let value = String(content).replace(/\r\n?/g, '\n');
  value = value.replace(/^\s*```[^\n]*$/gm, '').replace(/```/g, '');
  // HTML line breaks first, other tags last (avoid turning <br> into a space)
  value = value.replace(/<br\s*\/?>/gi, '\n');
  value = value.replace(/<[^>]+>/g, ' ');
  value = decodeEntities(value);

  const lines = value.split('\n').map((line) => {
    if (/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)) return '';
    return stripInlineMarkdown(line);
  });

  return lines
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getNoteTitle(content: string | undefined | null, fallback = ''): string {
  const firstLine = getNotePlainText(content)
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || fallback;
}

function getNoteExcerpt(content: string | undefined | null, maxLength = 72): string {
  const lines = getNotePlainText(content)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const body = lines.slice(1).join(' ').replace(/\s+/g, ' ').trim();
  if (!body) return '';
  if (body.length <= maxLength) return body;
  return `${body.slice(0, maxLength).trimEnd()}…`;
}

function countNoteWords(content: string | undefined | null): number {
  const text = getNotePlainText(content);
  const words = text.match(/[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*/gu);
  return words?.length ?? 0;
}

function countNoteCharacters(content: string | undefined | null): number {
  return getNotePlainText(content).length;
}

export {
  getNotePlainText,
  getNoteTitle,
  getNoteExcerpt,
  countNoteWords,
  countNoteCharacters,
};
