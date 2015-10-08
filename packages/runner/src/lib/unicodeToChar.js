import stripAnsi from 'strip-ansi'

export default function unicodeToChar(text) {
  if (!text) return ''

  return stripAnsi(text.replace(/\\u[\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef][\dABCDEFabcdef]/g,
    function (match) {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  }))
}
