import {motionFile} from '../gulp/babel'
import {Scanner} from '../gulp/scanner'
import Cache from '../cache'

const NEWLINE_REGEX = /\r\n|\n|\r/g
export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}

export function collectViews(contents) {
  const filePath = '__editor__'
  try {
    let views = {}
    Scanner.pre(filePath, contents, function(contents) {
      motionFile({
        contents,
        path: filePath,
        relative: filePath,
        sourceMap: false
      })
    })
    return Cache.getFileMeta(filePath) || {}
  } catch (_) {
    if (typeof _.pos !== 'undefined') {
      // Syntax error
      return {}
    } else throw _
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
