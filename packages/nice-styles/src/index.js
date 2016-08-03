/* @flow */

import { objectToColor } from './helpers'
import type { Transform } from './types'

const PSEUDO = new Set(['active', 'hover', 'focus', 'link', 'visited', 'checked', 'disabled', 'empty', 'invalid'])
const COLOR_KEYS = new Set(['background'])
const TRANSFORM_KEYS_MAP = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ'
}

function processTransform(transform: Transform): string {
  const toReturn = []
  for (const key in transform) {
    if (!transform.hasOwnProperty(key)) {
      continue
    }
    let value = transform[key]
    value = typeof value === 'number' ? `${value}px` : value
    toReturn.push(`${TRANSFORM_KEYS_MAP[key] || key}(${value})`)
  }
  return toReturn.join(' ')
}

function isCSSAble(val) {
  return (typeof val).match(/function|object/) && (
    val.toString || typeof val.css === 'function'
  )
}

function processArray(array: Array<number | string>): string {
  return array.map(function(style) {
    if (isCSSAble(style)) return style.css()
    return typeof style === 'number' ? `${style}px` : style
  }).join(' ')
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
      toReturn[key] = value.css()
      continue
    }
    if (COLOR_KEYS.has(key) || key.toLowerCase().indexOf('color') !== -1) {
      toReturn[key] = objectToColor(value)
      continue
    }
    if (key === 'transform') {
      toReturn[key] = processTransform(value)
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
      toReturn[key] = processArray(value)
      continue
    }
    throw new Error(`Invalid style value for ${key}`)
  }
  return toReturn
}

module.exports = processStyles
