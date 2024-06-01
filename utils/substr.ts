const substrTitle = (str: string) => {
  return str.split('\n')[0];
}

const substrContent = (str: string) => {
  return str.split('\n').slice(1).join('\n').substr(0, 60)?.replace(/(?:\r\n|\r|\n)/g, '')?.trim();
}

export {
  substrTitle,
  substrContent,
}
