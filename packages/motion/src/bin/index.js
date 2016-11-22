#!/usr/bin/env node
/* @flow */

require('process-bootstrap')('motion')

import Path from 'path'
import chalk from 'chalk'
import coolTrim from 'cool-trim'
import commander from 'commander'
import manifest from '../../package.json'
import { getMotion } from './helpers'

const currentDirectory = process.cwd()

commander
  .version(manifest.version)

commander
  .command('new [name]')
  .description('Create a new motion app with the given name')
  .action(function(name) {
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
commander
  .command('build')
  .description('Build dist files of the current motion app')
  .action(function() {
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
commander
  .command('watch', null, { isDefault: true })
  .action(function() {
    getMotion(currentDirectory, function(motion) {
      // $FlowIgnore: Flow doesn't recognize this prop
      return motion.watch(process.stdout.isTTY)
    })
  })
commander
  .command('init')
  .description('Try to transition current directory to a motion app')
  .action(function() {
    getMotion(currentDirectory, function(motion) {
      return motion.init().then(function() {
        console.log(coolTrim`
          ${chalk.green('Motion initialized successfully! Enjoy')}
          ${chalk.yellow('To run motion in your new app, do')}
            $ motion
        `)
      })
    })
  })

commander.parse(process.argv)

if (!commander.args.length) {
  // Execute default watch command
  getMotion(currentDirectory, function(motion) {
    // $FlowIgnore: Flow doesn't recognize this prop
    return motion.watch(process.stdout.isTTY)
  })
}
