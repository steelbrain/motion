/* @flow */

import { objectToColor } from './helpers'
import type { Transform } from './types'

const PSEUDO = new Set(['active', 'hover', 'focus', 'link', 'visited', 'checked', 'disabled', 'empty', 'invalid'])
const COLOR_KEYS = new Set(['background'])
const TRANSFORM_KEYS_MAP = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ',
  dropShadow: 'drop-shadow'
}

function isFloat(n) {
  return n === +n && n !== (n | 0)
}

function isCSSAble(val) {
  return val !== null && (typeof val).match(/function|object/) && (
    typeof val.toCSS === 'function' || typeof val.css === 'function'
  )
}

function getCSSVal(val) {
  return val.css ? val.css() : val.toCSS()
}

function processArray(key: string, array: Array<number | string>): string {
  // solid default option for borders
  if (key === 'border' && array.length === 2) {
    array.push('solid')
  }

  return array.map(function(style) {
    // recurse
    if (Array.isArray(style)) {
      return objectToColor(style)
    }
    // toCSS support
    if (isCSSAble(style)) {
      return getCSSVal(style)
    }

    return typeof style === 'number' ? `${style}px` : style
  }).join(' ')
}

function objectValue(key, value) {
  if (isFloat(value)) {
    return value
  }

  if (
    key === 'scale' ||
    key === 'grayscale' ||
    key === 'brightness'
  ) {
    return value
  }

  if (typeof value === 'number') {
    return `${value}px`
  }

  if (Array.isArray(value)) {
    return processArray(key, value)
  }

  return value
}

function processObject(transform: Transform): string {
  const toReturn = []
  for (const key in transform) {
    if (!transform.hasOwnProperty(key)) {
      continue
    }
    let value = transform[key]
    value = objectValue(key, value)
    toReturn.push(`${TRANSFORM_KEYS_MAP[key] || key}(${value})`)
  }
  return toReturn.join(' ')
}

function processStyles(styles: Object, includeEmpty: boolean = false): Object {
  const toReturn = {}
  for (const key in styles) {
    if (!styles.hasOwnProperty(key)) {
      continue
    }
    const value = styles[key]
    if ((typeof value === 'undefined' || value === null) && !includeEmpty) {
      continue
    }
    if (typeof value === 'string' || typeof value === 'number') {
      toReturn[key] = value
      continue
    }
    if (isCSSAble(value)) {
      toReturn[key] = getCSSVal(value)
      continue
    }
    if (COLOR_KEYS.has(key) || key.toLowerCase().indexOf('color') !== -1) {
      toReturn[key] = objectToColor(value)
      continue
    }
    if (key === 'transform' || key === 'filter') {
      toReturn[key] = processObject(value)
      continue
    }
    // recurse into object (psuedo or media query)
    if (key.substr(0, 1) === '@') {
      toReturn[key] = processStyles(value)
      continue
    }
    if (PSEUDO.has(key)) {
      toReturn[`:${key}`] = processStyles(value)
      continue
    }
    if (Array.isArray(value)) {
      toReturn[key] = processArray(key, value)
      continue
    }
    throw new Error(`Invalid style value for ${key}`)
  }
  return toReturn
}

module.exports = processStyles
