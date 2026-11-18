import { describe, expect, it } from 'vitest';
import { mergeDiff } from '~/utils/diff';
import { deepMerge } from '~/utils/object';

describe('diff helpers', () => {
  it('merges both sides of a word diff', () => {
    expect(mergeDiff('hello world', 'hello there')).toBe('hello worldthere');
    expect(mergeDiff('same', 'same')).toBe('same');
    expect(mergeDiff('', 'new')).toBe('new');
  });
});

describe('deepMerge', () => {
  it('merges nested objects without mutating the source', () => {
    const target = { a: 1, nested: { keep: true } };
    const source = { nested: { added: 2 }, list: [1, 2] };
    const result = deepMerge(target, source);

    expect(result).toEqual({ a: 1, nested: { keep: true, added: 2 }, list: [1, 2] });
    expect(source).toEqual({ nested: { added: 2 }, list: [1, 2] });
    expect(deepMerge(target, { nested: null })).toEqual({ a: 1, nested: null, list: [1, 2] });
  });
});
