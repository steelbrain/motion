export default function(val) {
  if (Array.isArray(val))
    return val
  if (typeof val == 'number')
    return Array.apply(null, Array(val))
      .map((_, i) => i + 1)
  else
    throw "Must pass an Array or Number to a repeat, you passed " + (typeof val)
}