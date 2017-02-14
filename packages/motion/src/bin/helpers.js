/* @flow */

import Motion from '../'

export function getMotion(rootDirectory: string = process.cwd(), callback: ((motion: Motion) => any)) {
  return Motion.create(rootDirectory).then(function(motion) {
    let motionIsAlive = true
    function killMotion() {
      if (motionIsAlive) {
        motionIsAlive = false
        motion.dispose()
      }
      process.exit()
    }

    process.on('SIGINT', killMotion)
    process.on('exit', killMotion)
    return callback(motion)
  }).catch(function(error) {
    console.error('Error:', error && (error.motion ? error.message : error.stack))
    process.exitCode = 1
  })
}
