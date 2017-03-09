/* @flow */

import chalk from 'chalk'
import coolTrim from 'cool-trim'
import Motion from '../'

export function getMotion(options: Object, rootDirectory: string = process.cwd(), callback: ((motion: Motion) => any)) {
  return Motion.create(rootDirectory, {
    debug: options.debug,
    debugDedupe: options.debugDedupe,
    debugTickAll: options.debugTickAll,
    useCache: !options.disableCache,
  }).then(function(motion) {
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
    console.error('Error:', error && (options.debug ? error.stack : error.message))
    process.exitCode = 1
  })
}

export const messageNew = (name: string) => coolTrim`
  ${chalk.green('App created successfully! Enjoy')}
  ${chalk.yellow('To run motion in your new app, do')}
    $ cd ${name}
    $ motion
`

export const messageInit = () => coolTrim`
  ${chalk.green('Motion initialized successfully! Enjoy')}
  ${chalk.yellow('To run motion in your new app, do')}
    $ motion
`
export const messageBuild = (distDirectory: string) => coolTrim`
  ${chalk.green('App built successfully')}
  To access the built files, do
    $ cd ${distDirectory}
`
