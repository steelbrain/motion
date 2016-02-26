#!/usr/bin/env node
'use strict'


import commander from 'commander'
const parameters = require('minimist')(process.argv.slice(2))
const command = parameters['_'][0]
const validCommands = ['new', 'build', 'update', 'init']

// TODO: Check for updates

// Note: This is a trick to make multiple commander commands work with single executables
process.argv = process.argv.slice(0, 2).concat(process.argv.slice(3))

if (!command || command === 'run') {
  require('./motion-run')
} else if (validCommands.indexOf(command) !== -1) {
  require(`./motion-${command}`)
} else {
  console.error(`
    Usage:
      motion                        run your motion app
      motion new [name] [template]  start a new app
      motion build                  build for production
      motion update                 update motion
      motion init                   add a motion config to an existing app (temporary, awaiting https://github.com/motion/motion/issues/339)
    `.trim())
  process.exit(1)
}
