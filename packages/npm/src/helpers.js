'use strict'

/* @flow */

export function versionFromRange(range: string): Array<string> {
  const matches = range.match(/[0-9\.]+/g)
  return matches && matches.length ? matches : []
}
