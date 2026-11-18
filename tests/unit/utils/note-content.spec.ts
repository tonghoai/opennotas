import { describe, expect, it } from 'vitest';
import {
  countNoteCharacters,
  countNoteWords,
  getNoteExcerpt,
  getNotePlainText,
  getNoteTitle,
} from '~/utils/note-content';

describe('note content pipeline', () => {
  it('converts markdown and HTML to readable text', () => {
    const content = [
      '# Title',
      '',
      'A **bold** [link](https://example.com) and `code`.',
      '<br />Next &amp; line',
      '> quote',
      '- [x] task',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      '<span>closing &lt;tag&gt;</span>',
    ].join('\n');

    const text = getNotePlainText(content);
    expect(text).toContain('Title');
    expect(text).toContain('A bold link and code.');
    expect(text).toContain('Next & line');
    expect(text).toContain('quote');
    expect(text).toContain('task');
    expect(text).toContain('closing <tag>');
  });

  it('decodes numeric and named entities', () => {
    expect(getNotePlainText('&amp; &lt; &#65; &#x42; &nbsp;x')).toBe('& < A B x');
  });

  it('returns empty values for missing content', () => {
    expect(getNotePlainText(null)).toBe('');
    expect(getNotePlainText(undefined)).toBe('');
    expect(getNotePlainText('')).toBe('');
    expect(getNoteTitle(null, 'fallback')).toBe('fallback');
    expect(getNoteExcerpt(null)).toBe('');
    expect(countNoteWords(null)).toBe(0);
    expect(countNoteCharacters(null)).toBe(0);
  });

  it('uses the first meaningful line as the title', () => {
    expect(getNoteTitle('\n\n# Hello **world**\nSecond line')).toBe('Hello world');
    expect(getNoteTitle('```\ncode\n```\nReal title', 'fallback')).toBe('code');
    expect(getNoteTitle('---\nTitle')).toBe('Title');
  });

  it('builds an excerpt from the body and truncates with an ellipsis', () => {
    expect(getNoteExcerpt('Title\nFirst line\nSecond line', 80)).toBe('First line Second line');
    expect(getNoteExcerpt('Title\n' + 'x'.repeat(100), 10)).toBe('xxxxxxxxxx…');
    expect(getNoteExcerpt('Only title')).toBe('');
  });

  it('counts words and characters after stripping markup', () => {
    expect(countNoteWords('# Hello world\nThis is **OpenNotas**')).toBe(5);
    expect(countNoteWords("hello-world don't")).toBe(2);
    expect(countNoteCharacters('# Hi\n**there**')).toBe('Hi\nthere'.length);
  });
});
