function getFirstLine(text: string): string {
  return text.split('\n')[0];
}

function getSecondLine(text: string): string {
  return text.split('\n')[1];
}

function substrWord(text: string, start: number, end: number): string {
  return text.substring(start, end);
}

function removeBreakLine(text: string): string {
  return text.replace(/(?:\r\n|\r|\n)/g, '');
}

function getFirstLineSubstrWord(text: string, numWords: number): string {
  return removeBreakLine(substrWord(getFirstLine(text), 0, numWords)).trim();
}

function getSecondLineSubstrWord(text: string, numWords: number): string {
  return removeBreakLine(substrWord(getSecondLine(text), 0, numWords)).trim();
}

function removeSpecialChar(text: string): string {
  // strip HTML tags first, then keep only letters, numbers and spaces
  return text?.replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim() || '';
}

// Remove escape characters added by GFM serializer before markdown special chars
function removeMarkdownEscape(text: string): string {
  return text?.replace(/\\([*_[\](){}#+\-.!|>~`\\])/g, '$1') || '';
}

export {
  getFirstLine,
  getSecondLine,
  substrWord,
  removeBreakLine,
  getFirstLineSubstrWord,
  getSecondLineSubstrWord,
  removeSpecialChar,
  removeMarkdownEscape,
}
