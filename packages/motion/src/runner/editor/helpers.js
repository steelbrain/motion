const NEWLINE_REGEX = /\r\n|\n|\r/g
export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}

export function collectViews(contents) {
  throw new Error('To be rewritten')
}

export function pointWithinRange(point, range) {
  return point.isGreaterThan(range[0]) && point.isLessThan(range[1])
}

export function getObjectAtPosition(objects, position) {
  for (const key in objects) {
    const value = objects[key]
    if (pointWithinRange(position, value.location)) {
      return value
    }
  }
  return null
}

export function getRowFromText(text, row) {
  const rowText = text.split(NEWLINE_REGEX)[row]
  return rowText || ''
}
