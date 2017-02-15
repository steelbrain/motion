/* @flow */

import Motion from '../'

export function getMotion(options: Object, rootDirectory: string = process.cwd(), callback: ((motion: Motion) => any)) {
  if (options.debug) {
    process.env.PUNDLE_DEBUG_REPORTS = '1'
  }

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
