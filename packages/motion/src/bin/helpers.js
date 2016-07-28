/* @flow */

import Motion from '../'

export function getMotion(rootDirectory: string = process.cwd(), callback: ((motion: Motion) => any)) {
  return Motion.create(rootDirectory).then(callback).catch(function(error) {
    console.error(error.motion ? error.messag : error.stack)
    process.exitCode = 1
  })
}
