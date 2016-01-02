export default function(val) {
  if (Array.isArray(val) || isIterable(val))
    return val
  if (typeof val == 'number')
    return Array.apply(null, Array(val))
      .map((_, i) => i + 1)
  else
    throw new Error("Must pass an Array, Number or Iterable to a repeat, you passed " + (typeof val))
    // TODO: make this use view.range() and then we can throw nicer errors with view name
}

function isIterable(obj){
  if (obj === undefined || obj === null) {
    return false
  }
  else {
    return typeof Symbol != 'undefined' && obj[Symbol.iterator] !== undefined
  }
}
