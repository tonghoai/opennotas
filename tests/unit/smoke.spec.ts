import { describe, expect, it } from 'vitest';
import { getNoteTitle } from '~/utils/note-content';

describe('test harness', () => {
  it('resolves the app alias', () => {
    expect(getNoteTitle('Hello world')).toBe('Hello world');
  });
});
