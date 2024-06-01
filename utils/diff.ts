import * as diff from 'diff';

function mergeDiff(str1: any, str2: any) {
  const diffContent = diff.diffWords(str1, str2);
  let mergedText = '';

  diffContent.forEach((part) => {
    if (part.added) {
      mergedText += part.value;
    } else if (part.removed) {
      mergedText += part.value;
    } else {
      mergedText += part.value;
    }
  });

  return mergedText;
}

export {
  mergeDiff,
};
