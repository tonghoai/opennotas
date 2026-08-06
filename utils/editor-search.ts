import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorState, Transaction } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';
import { scrollFormEditorsIntoView } from '~/utils/editor-scroll';

type Match = { from: number; to: number };
type SearchCounts = { current: number; total: number };
type SearchState = {
  query: string;
  matches: Match[];
  activeIndex: number;
};

const searchPluginKey = new PluginKey<SearchState>('note-search');

const HIGHLIGHT_NAME = 'search-match';
const HIGHLIGHT_ACTIVE_NAME = 'search-match-active';

function hasHighlightApi(): boolean {
  return typeof CSS !== 'undefined' && !!CSS.highlights;
}

// The CSS Highlight API paints highlights directly on the paint layer without adding
// DOM nodes, so it cannot split text nodes or break Markdown formatting (bold, code,
// links, headings, etc.). We use it on browsers that support it and fall back to
// ProseMirror inline decorations on older browsers (e.g. Firefox as of 2026).
function clearHighlightRanges(): void {
  if (!hasHighlightApi()) return;
  try {
    CSS.highlights.delete(HIGHLIGHT_NAME);
    CSS.highlights.delete(HIGHLIGHT_ACTIVE_NAME);
  } catch (_) {
    // CSS.highlights may throw on stale ranges; ignore.
  }
}

function rangeFromMatch(view: EditorView, match: Match): Range | null {
  try {
    const start = view.domAtPos(match.from);
    const end = view.domAtPos(match.to);
    if (!start.node || !end.node) return null;
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range;
  } catch (_) {
    return null;
  }
}

function updateHighlightRanges(view: EditorView): void {
  if (!hasHighlightApi()) return;
  const pluginState = searchPluginKey.getState(view.state);
  if (!pluginState || !pluginState.query || !pluginState.matches.length) {
    clearHighlightRanges();
    return;
  }

  const ranges: Range[] = [];
  const activeRanges: Range[] = [];

  for (let i = 0; i < pluginState.matches.length; i++) {
    const range = rangeFromMatch(view, pluginState.matches[i]);
    if (!range) continue;
    if (i === pluginState.activeIndex) {
      activeRanges.push(range);
    } else {
      ranges.push(range);
    }
  }

  clearHighlightRanges();
  if (ranges.length) {
    CSS.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
  }
  if (activeRanges.length) {
    CSS.highlights.set(HIGHLIGHT_ACTIVE_NAME, new Highlight(...activeRanges));
  }
}

function getActiveMatchRect(view: EditorView): DOMRect | null {
  const pluginState = searchPluginKey.getState(view.state);
  if (!pluginState || pluginState.activeIndex < 0 || pluginState.activeIndex >= pluginState.matches.length) {
    return null;
  }
  const match = pluginState.matches[pluginState.activeIndex];

  if (hasHighlightApi()) {
    const range = rangeFromMatch(view, match);
    if (range) {
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) return rect;
    }
  }

  const el = view.dom.querySelector('.search-match-active');
  if (el) return el.getBoundingClientRect();

  try {
    return view.coordsAtPos(match.from) as DOMRect | null;
  } catch (_) {
    return null;
  }
}

// Flattens the doc into plain text (inserting a separator between textblocks so a query
// never matches across paragraph/heading/list-item/code-block boundaries) alongside a
// parallel array mapping each character back to its ProseMirror position, then does a
// simple case-insensitive substring scan over that flat text.
function findMatches(doc: PMNode, query: string): Match[] {
  if (!query) return [];

  const q = query.toLowerCase();
  let text = '';
  const posMap: number[] = [];

  doc.descendants((node, pos) => {
    if (node.isTextblock && text.length > 0) {
      text += '\n';
      posMap.push(pos);
    }
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) {
        posMap.push(pos + i);
      }
      text += node.text;
    }
    return true;
  });

  const lowerText = text.toLowerCase();
  const matches: Match[] = [];
  let searchFrom = 0;
  while (true) {
    const found = lowerText.indexOf(q, searchFrom);
    if (found === -1) break;

    matches.push({ from: posMap[found], to: posMap[found + q.length - 1] + 1 });
    searchFrom = found + q.length;
  }

  return matches;
}

function buildDecorations(doc: PMNode, state: SearchState): DecorationSet {
  // When the CSS Highlight API is available we paint highlights at the paint layer and
  // keep the DOM untouched, so ProseMirror inline decorations are not needed.
  if (hasHighlightApi()) return DecorationSet.empty;
  if (!state.matches.length) return DecorationSet.empty;

  const decorations = state.matches.map((match, index) =>
    Decoration.inline(match.from, match.to, {
      class: index === state.activeIndex ? 'search-match search-match-active' : 'search-match',
    })
  );
  return DecorationSet.create(doc, decorations);
}

function createSearchPlugin(): Plugin<SearchState> {
  return new Plugin<SearchState>({
    key: searchPluginKey,
    state: {
      init(): SearchState {
        return { query: '', matches: [], activeIndex: -1 };
      },
      apply(tr: Transaction, prev: SearchState, _oldState: EditorState, newState: EditorState): SearchState {
        const meta = tr.getMeta(searchPluginKey);
        if (meta?.type === 'setQuery') {
          const matches = findMatches(newState.doc, meta.query);
          return { query: meta.query, matches, activeIndex: matches.length ? 0 : -1 };
        }
        if (meta?.type === 'step') {
          return { ...prev, activeIndex: meta.activeIndex };
        }
        if (meta?.type === 'clear') {
          return { query: '', matches: [], activeIndex: -1 };
        }

        // keep highlights accurate as the user keeps typing/editing with the bar open
        if (tr.docChanged && prev.query) {
          const matches = findMatches(newState.doc, prev.query);
          const activeIndex = matches.length
            ? Math.min(prev.activeIndex === -1 ? 0 : prev.activeIndex, matches.length - 1)
            : -1;
          return { query: prev.query, matches, activeIndex };
        }

        return prev;
      },
    },
    props: {
      decorations(state: EditorState) {
        const pluginState = searchPluginKey.getState(state);
        if (!pluginState) return DecorationSet.empty;
        return buildDecorations(state.doc, pluginState);
      },
    },
    view(view: EditorView) {
      // Sync the CSS Highlight API ranges with the plugin state.
      let lastState: SearchState = { query: '', matches: [], activeIndex: -1 };
      updateHighlightRanges(view);
      return {
        update(view: EditorView, _prevState: EditorState) {
          const pluginState = searchPluginKey.getState(view.state);
          if (
            pluginState &&
            pluginState.query === lastState.query &&
            pluginState.activeIndex === lastState.activeIndex &&
            pluginState.matches.length === lastState.matches.length &&
            pluginState.matches.every((m, i) =>
              m.from === lastState.matches[i]?.from && m.to === lastState.matches[i]?.to
            )
          ) {
            return;
          }
          lastState = pluginState
            ? { query: pluginState.query, matches: pluginState.matches.slice(), activeIndex: pluginState.activeIndex }
            : { query: '', matches: [], activeIndex: -1 };
          updateHighlightRanges(view);
        },
        destroy() {
          clearHighlightRanges();
        },
      };
    },
  });
}

function getSearchCounts(state: EditorState): SearchCounts {
  const pluginState = searchPluginKey.getState(state);
  if (!pluginState || !pluginState.matches.length) return { current: 0, total: 0 };
  return { current: pluginState.activeIndex + 1, total: pluginState.matches.length };
}

function scrollActiveMatchIntoView(view: EditorView) {
  requestAnimationFrame(() => {
    const matchRect = getActiveMatchRect(view);
    if (!matchRect) return;

    if (!document.getElementById('form-editors')) {
      const activeMatch = view.dom.querySelector('.search-match-active');
      activeMatch?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      return;
    }

    scrollFormEditorsIntoView(matchRect);
  });
}

function setSearchState(view: EditorView, query: string): SearchCounts {
  view.dispatch(view.state.tr.setMeta(searchPluginKey, { type: 'setQuery', query }));
  if (query) scrollActiveMatchIntoView(view);
  return getSearchCounts(view.state);
}

function stepMatch(view: EditorView, direction: 1 | -1): SearchCounts {
  const pluginState = searchPluginKey.getState(view.state);
  if (!pluginState || !pluginState.matches.length) return { current: 0, total: 0 };

  const total = pluginState.matches.length;
  const nextIndex = (pluginState.activeIndex + direction + total) % total;
  view.dispatch(view.state.tr.setMeta(searchPluginKey, { type: 'step', activeIndex: nextIndex }));
  scrollActiveMatchIntoView(view);
  return getSearchCounts(view.state);
}

function clearSearchState(view: EditorView): void {
  view.dispatch(view.state.tr.setMeta(searchPluginKey, { type: 'clear' }));
}

export {
  createSearchPlugin,
  setSearchState,
  stepMatch,
  clearSearchState,
  getSearchCounts,
};
export type { SearchCounts };
