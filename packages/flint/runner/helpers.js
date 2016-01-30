'use babel'

import TransformPlugin from './transform'
import {transform as babelTransform} from 'flint-babel-core'
import getOption from './opts'
import {Parser} from './compiler'

const NEWLINE_REGEX = /\r\n|\n|\r/g
const transformPlugin = new TransformPlugin()

export function isProduction() {
  return getOption('build')
}

export function getBabelConfig(config) {
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: getOption('pretty') ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [transformPlugin.get(config)],
    extra: { production: isProduction() }
  }
}

export function transformText(text, {
  log = null,
  writeStyle = null,
  onMeta = null,
  onImports = null,
  onExports = null
}) {
  let toReturn = ''
  Parser.pre('unknown', text, function(text) {
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
