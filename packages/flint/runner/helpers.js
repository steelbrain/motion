'use babel'

import FlintTransform from 'flint-transform'
import {transform as babelTransform} from 'flint-babel-core'
import getOption from './opts'
import {Parser} from './compiler'
import {Emitter} from 'sb-event-kit'

const NEWLINE_REGEX = /\r\n|\n|\r/g
const emitter = new Emitter()
let flintTransform = null

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
  if (flintTransform === null) {
    flintTransform = FlintTransform.file({
      basePath: getOption('dir'),
      production: isProduction(),
      selectorPrefix: getOption('config').selectorPrefix || '#_flintapp ',
      log() {
        emitter.emit('emit', ...arguments)
      },
      writeStyle() {
        emitter.emit('writeStyle', ...arguments)
      },
      onMeta() {
        emitter.emit('onMeta', ...arguments)
      },
      onImports() {
        emitter.emit('onImports', ...arguments)
      },
      onExports() {
        emitter.emit('onExports', ...arguments)
      }
    })
  }
  if (log !== null) {
    emitter.on('log', log)
  }
  if (writeStyle !== null) {
    emitter.on('writeStyle', writeStyle)
  }
  if (onMeta !== null) {
    emitter.on('onMeta', onMeta)
  }
  if (onImports !== null) {
    emitter.on('onImports', onImports)
  }
  if (onExports !== null) {
    emitter.on('onExports', onExports)
  }
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: getOption('pretty') ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [flintTransform],
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
