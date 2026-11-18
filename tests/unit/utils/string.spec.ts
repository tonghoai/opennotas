import { describe, expect, it } from 'vitest';
import {
  getFirstLine,
  getFirstLineSubstrWord,
  getSecondLine,
  getSecondLineSubstrWord,
  removeBreakLine,
  removeMarkdownEscape,
  removeSpecialChar,
  substrWord,
} from '~/utils/string';
import { substrContent, substrTitle } from '~/utils/substr';

describe('string helpers', () => {
  it('reads first and second lines', () => {
    expect(getFirstLine('one\ntwo')).toBe('one');
    expect(getSecondLine('one\ntwo')).toBe('two');
    expect(getSecondLine('one')).toBeUndefined();
  });

  it('extracts word prefixes and removes line breaks', () => {
    expect(substrWord('abcdef', 1, 4)).toBe('bcd');
    expect(removeBreakLine('a\r\nb\rc\nd')).toBe('abcd');
    expect(getFirstLineSubstrWord('hello world\nignored', 5)).toBe('hello');
    expect(getSecondLineSubstrWord('ignored\nhello world', 5)).toBe('hello');
  });

  it('strips HTML, punctuation and markdown escapes', () => {
    expect(removeSpecialChar('<p>Hello, world!</p>')).toBe('Hello world');
    expect(removeSpecialChar('Tiếng Việt 123')).toBe('Tiếng Việt 123');
    expect(removeSpecialChar('')).toBe('');
    expect(removeMarkdownEscape('\\*not italic\\* and \\[link\\]')).toBe('*not italic* and [link]');
    expect(removeMarkdownEscape('')).toBe('');
  });

  it('keeps the legacy substr helpers aligned with note content', () => {
    expect(substrTitle('# Hello\nBody')).toBe('Hello');
    expect(substrContent('# Hello\nBody copy')).toBe('Body copy');
  });
});
