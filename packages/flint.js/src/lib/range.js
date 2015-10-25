export default function(val) {
  if (Array.isArray(val))
    return val
  if (typeof val == 'number')
    return Array.apply(null, Array(val))
      .map((_, i) => i + 1)
}