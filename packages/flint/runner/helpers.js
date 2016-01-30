'use babel'

import FlintTransform from 'flint-transform'
import getOption from './opts'
import {transform as babelTransform} from 'flint-babel-core'

const NEWLINE_REGEX = /\r\n|\n|\r/g

export function isProduction() {
  return getOption('build')
}

export function getBabelConfig({
  log = null,
  writeStyle = null,
  onMeta = null,
  onImports = null,
  onExports = null
}) {
  const transformParameters = {
    log,
    writeStyle,
    onMeta,
    onImports,
    onExports,
    basePath: getOption('dir'),
    production: isProduction(),
    selectorPrefix: getOption('config').selectorPrefix || '#_flintapp ',
  }
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: getOption('pretty') ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [FlintTransform.file(transformParameters)],
    extra: { production: isProduction() }
  }
}

export function transformFile(text, {
  log = null,
  writeStyle = null,
  onMeta = null,
  onImports = null,
  onExports = null
}) {
  return babelTransform(text, getBabelConfig({
    log, writeStyle, onMeta, onImports, onExports
  }))
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
