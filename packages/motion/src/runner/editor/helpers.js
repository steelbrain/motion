import {motionFile} from '../gulp/babel'
import Cache from '../cache'

const NEWLINE_REGEX = /\r\n|\n|\r/g
export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}

export function collectViews(contents) {
  try {
    motionFile({
      contents,
      path: '__editor__',
      relative: '__editor__',
      sourceMap: false
    })
    return Cache.getFileMeta('__editor__') || {}
  } catch (_) {
    return {}
  }
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
