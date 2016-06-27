/* @flow */

import type { Color } from './types'

export function objectToColor(color: Color): string {
  if (Array.isArray(color)) {
    const length = color.length
    if (length === 4) {
      return `rgba(${color.join(', ')})`
    }
    if (length === 3) {
      return `rgb(${color.join(', ')})`
    }
    throw new Error('Invalid color provided')
  }
  if (color.a) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
  }
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}
