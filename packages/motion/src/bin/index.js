#!/usr/bin/env node
/* @flow */

require('process-bootstrap')('motion')

import Path from 'path'
import chalk from 'chalk'
import command from 'sb-command'
import coolTrim from 'cool-trim'
import manifest from '../../package.json'
import { getMotion } from './helpers'

const currentDirectory = process.cwd()

command
  .version(`Motion v${manifest.version}`)
  .command('new <name>', 'Create a new motion app with the given name', function(options, name) {
    getMotion(Path.join(currentDirectory, name), function(motion) {
      return motion.init().then(function() {
        console.log(coolTrim`
          ${chalk.green('App created successfully! Enjoy')}
          ${chalk.yellow('To run motion in your new app, do')}
            $ cd ${name}
            $ motion
        `)
      })
    })
  })
  .command('build', 'Build dist files of the current motion app', function() {
    getMotion(currentDirectory, function(motion) {
      // $FlowIgnore: Flow doesn't recognize this prop
      return motion.build(process.stdout.isTTY).then(function() {
        console.log(coolTrim`
          ${chalk.green('App built successfully')}
          To access the built files, do
            $ cd ${Path.relative(currentDirectory, motion.config.getPublicDirectory())}
        `)
      })
    })
  })
  .command('watch', 'Make the Motion CLI run Dev server and watch the files for changes', function() {
    getMotion(currentDirectory, function(motion) {
      // $FlowIgnore: Flow doesn't recognize this prop
      return motion.watch(process.stdout.isTTY)
    })
  })
  .command('init', 'Copy motion configuation files into the current directory', function() {
    getMotion(currentDirectory, function(motion) {
      return motion.init(false, {
        init() {
          console.log(coolTrim`
            ${chalk.green('Motion initialized successfully! Enjoy')}
            ${chalk.yellow('To run motion in your new app, do')}
              $ motion
          `)
        },
      })
    })
  })
  .default(function(_, ...commands) {
    if (commands.length !== 0) {
      command.showHelp()
      process.exit(1)
    }
    getMotion(currentDirectory, function(motion) {
      // $FlowIgnore: Flow doesn't recognize this prop
      return motion.watch(process.stdout.isTTY)
    })
  })
  .parse(process.argv)
