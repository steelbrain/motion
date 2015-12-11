export default function findExports(source) {
  return (
    /exports(\[[\'\"]default[\'\"]\]|\.[a-zA-Z\$\_]+) \=/g.test(source) ||
    /module\.exports\s*\=\s*exports/g.test(source)
  )
}