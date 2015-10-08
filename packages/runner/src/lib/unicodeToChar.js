export default function unicodeToChar(text) {
  return !text ? '' : text.replace(/\\u[\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef]/g,
    function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}
