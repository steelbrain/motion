#!/usr/bin/env node
'use strict'

const command = process.argv[2] || ''
const validCommands = ['new', 'build', 'update', 'init']

// TODO: Check for updates

// Note: This is a trick to make multiple commander commands work with single executables
// In: [nodePath, 'motion', 'run', '--help']
// Out: [nodePath, 'motion run', '--help']
process.argv = [process.argv[0], [process.argv[1], process.argv[2]].join(' ').trim()].concat(process.argv.slice(3))

let showHelp = command === '--help'

if (!showHelp && (!command || command === 'run')) {
  require('./motion-run')
} else if (!showHelp && validCommands.indexOf(command) !== -1) {
  require(`./motion-${command}`)
} else {
  console.error(`
    Usage:
      motion                        alias for 'motion run'
      motion run                    run your motion app
      motion new [name] [template]  start a new app
      motion build                  build for production
      motion update                 update motion
      motion init                   add a motion config to an existing app (temporary, awaiting https://github.com/motion/motion/issues/339)
    `.trim())
  process.exit(1)
}
