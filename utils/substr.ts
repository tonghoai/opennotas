const substrTitle = (str: string) => {
  return str.split('\n')[0];
}

const substrContent = (str: string) => {
  return (str.split('\n').slice(1).find(line => line.trim() !== '') ?? '').substr(0, 60).trim();
}

export {
  substrTitle,
  substrContent,
}
