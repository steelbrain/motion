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

  Scanner.pre(false, text, function(text) {
    const babelConfig = getBabelConfig({
      log, writeStyle, onMeta, onImports, onExports
    })
    babelConfig.filename = '__editor__'
    babelTransform(text, babelConfig)
  })
  transformPlugin.disposeLast()
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
