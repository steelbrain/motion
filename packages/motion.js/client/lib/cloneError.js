export default function cloneError(e) {
  let result = {}
  let keys = Object.getOwnPropertyNames(e)
  keys.forEach(k => result[k] = e[k])
  return result
}