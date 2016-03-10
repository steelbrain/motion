#!/usr/bin/env node

// NOTE: To allow `pidof motion`
process.title = 'motion'

process.on('uncaughtException', function(error) {
  console.log('Uncaught Exception', error)
})
process.on('unhandledRejection', function(reason, promise) {
  console.log('Unhandled Rejection at: Promise ', promise, ' reason: ', reason)
})

const Path = require('path')
const Motion = require('../')
const chalk = require('chalk')
const trim = require('cool-trim')
const manifest = require('../../package.json')
const parameters = process.argv.slice(2)
const command = parameters[0]
const options = require('minimist')(parameters)
const commands = options._
let showHelp = options.h || options.help

if (options.v || options.version) {
  console.log(`Motion v${manifest.version}`)
  process.exit()
}

function getMotion(rootDirectory: string = process.cwd()): Promise<Motion> {
  return Motion.create({ rootDirectory })
}
function handleError(error: Error) {
  console.error(error)
  process.exit(1)
}

if (command === 'new') {
  const name = commands[1]
  if (!name) {
    console.error('Please enter a valid app name')
    process.exit(1)
  }
  getMotion(Path.join(process.cwd(), name)).then(function(motion) {
    return motion.init()
  }).then(function() {
    console.log(trim(`
      ${chalk.green('App created successfully! Enjoy')}
      ${chalk.yellow('To run motion in your new app, do')}
        $ cd ${name}
        $ motion
    `))
  }, handleError)
} else if (command === 'build') {
  getMotion().then(function(motion) {
    return motion.build(true)
  }).then(function() {
    console.log(chalk.green('App built successfully'))
  }, handleError)
} else if (command === 'init') {
  getMotion().then(function(motion) {
    return motion.init()
  }).then(function() {
    console.log(trim(`
      ${chalk.green('Motion initialized successfully! Enjoy')}
      ${chalk.yellow('To run motion in your new app, do')}
        $ motion
    `))
  }, handleError)
} else if (!commands.length && !showHelp) { // run
  getMotion().then(function(motion) {
    return motion.watch(true)
  }).catch(handleError)
} else {
  showHelp = true
}

if (showHelp) {
  console.log(trim(`
    Motion v${manifest.version}, Usage:
      motion                        Run current Motion app
      motion -h, --help             Show this help
      motion -v, --version          Show Motion version
      motion new $name              Create new Motion app with $name as name
      motion build                  Built current Motion app
      motion init                   Add Motion config to current app
    `))
  process.exit(1)
}
