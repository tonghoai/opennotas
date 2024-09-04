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
  return text?.replace(/[^\p{L}\p{N}\s]/gu, '') || '';
}

export {
  getFirstLine,
  getSecondLine,
  substrWord,
  removeBreakLine,
  getFirstLineSubstrWord,
  getSecondLineSubstrWord,
  removeSpecialChar,
}
