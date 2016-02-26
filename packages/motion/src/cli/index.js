#!/usr/bin/env node
'use strict'


import commander from 'commander'
const parameters = require('minimist')(process.argv.slice(2))
const command = parameters['_'][0]
const validCommands = ['new', 'build', 'update', 'init']

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
