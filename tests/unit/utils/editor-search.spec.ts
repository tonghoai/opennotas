import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import {
  clearSearchState,
  createSearchPlugin,
  getSearchCounts,
  setSearchState,
  stepMatch,
} from '~/utils/editor-search';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*' },
    text: { group: 'inline' },
  },
  marks: {},
});

function makeView() {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('Hello world hello')]),
    schema.node('paragraph', null, [schema.text('HELLO again')]),
  ]);
  let state = EditorState.create({ doc, plugins: [createSearchPlugin()] });
  const view: any = {
    dom: document.createElement('div'),
    get state() { return state; },
    dispatch(tr: any) { state = state.apply(tr); },
    coordsAtPos: () => null,
  };
  return view;
}

beforeAll(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(0);
    return 0;
  });
});

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('editor search plugin', () => {
  it('finds case-insensitive matches and counts them', () => {
    const view = makeView();
    expect(getSearchCounts(view.state)).toEqual({ current: 0, total: 0 });

    expect(setSearchState(view, 'hello')).toEqual({ current: 1, total: 3 });
    expect(setSearchState(view, 'HELLO')).toEqual({ current: 1, total: 3 });
    expect(setSearchState(view, 'missing')).toEqual({ current: 0, total: 0 });
    expect(setSearchState(view, '')).toEqual({ current: 0, total: 0 });
  });

  it('does not match across paragraph boundaries', () => {
    const view = makeView();
    expect(setSearchState(view, 'hello world')).toEqual({ current: 1, total: 1 });
    expect(setSearchState(view, 'hellohello')).toEqual({ current: 0, total: 0 });
  });

  it('steps through matches with wrap-around', () => {
    const view = makeView();
    setSearchState(view, 'hello');
    expect(stepMatch(view, 1)).toEqual({ current: 2, total: 3 });
    expect(stepMatch(view, 1)).toEqual({ current: 3, total: 3 });
    expect(stepMatch(view, 1)).toEqual({ current: 1, total: 3 });
    expect(stepMatch(view, -1)).toEqual({ current: 3, total: 3 });
  });

  it('clears the search state', () => {
    const view = makeView();
    setSearchState(view, 'hello');
    clearSearchState(view);
    expect(getSearchCounts(view.state)).toEqual({ current: 0, total: 0 });
    expect(stepMatch(view, 1)).toEqual({ current: 0, total: 0 });
  });

  it('updates matches when the document changes while the bar is open', () => {
    const view = makeView();
    setSearchState(view, 'hello');
    const paragraph = view.state.doc.firstChild;
    const tr = view.state.tr.insertText(' hello', paragraph!.nodeSize - 1);
    view.dispatch(tr);
    expect(getSearchCounts(view.state)).toEqual({ current: 1, total: 4 });
  });

  it('keeps the active index in range when matches disappear', () => {
    const view = makeView();
    setSearchState(view, 'hello');
    stepMatch(view, 1);
    stepMatch(view, 1);
    const tr = view.state.tr.delete(0, view.state.doc.content.size);
    view.dispatch(tr);
    expect(getSearchCounts(view.state)).toEqual({ current: 0, total: 0 });
  });
});
