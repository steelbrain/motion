import { transform as babelTransform } from 'flint-babel-core'
import { Scanner } from '../gulp/scanner'
import { transformPlugin, getBabelConfig } from '../helpers'

const NEWLINE_REGEX = /\r\n|\n|\r/g
export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}

export function transformText(text, {
  log = null,
  writeStyle = null,
  onMeta = null,
  onImports = null,
  onExports = null
}) {
  let toReturn = ''
  // Setting this key so it's easier to distinguish in debug output
  Scanner.pre('__editor__', text, function(text) {
    toReturn = babelTransform(text, getBabelConfig({
      log, writeStyle, onMeta, onImports, onExports
    }))
  })
  transformPlugin.disposeLast()
  return toReturn
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
