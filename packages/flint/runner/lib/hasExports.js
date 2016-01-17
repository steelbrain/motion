export default function hasExports(source) {
  const defineExports = `Object.defineProperty(exports, '__esModule', { value: true });`
  const defineExportsAlt = `Object.defineProperty(exports, "__esModule", { value: true });`

  const hasExport = (
    source.indexOf(defineExports) >= 0
    || source.indexOf(defineExportsAlt) >= 0
    || /exports(\[[\'\"]default[\'\"]\]|\.[a-zA-Z\$\_]+) \=/g.test(source)
    || /module\.exports\s*\=\s*exports/g.test(source)
  )

  return hasExport
}