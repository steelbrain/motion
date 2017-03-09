#!/usr/bin/env node
/* @flow */

require('process-bootstrap')('motion')

import Path from 'path'
import command from 'sb-command'
import manifest from '../../package.json'
import { getMotion, messageNew, messageInit, messageBuild } from './helpers'

const currentDirectory = process.cwd()

command
  .version(`Motion v${manifest.version}`)
  .option('--debug', 'Enable stack traces of errors, useful for debugging', false)
  .option('--debug-dedupe', 'Enable logs about things dedupe picks and leaves out', false)
  .option('--debug-tick-all', 'Show all files in watcher ticks instead including files in node_modules', false)
  .option('--disable-cache', 'Disable use of cache when bundling files', false)
  .command('new <name>', 'Create a new motion app with the given name', function(options: Object, name) {
    getMotion(options, Path.join(currentDirectory, name), function(motion) {
      return motion.init().then(function() {
        motion.compilation.log(messageNew(name))
      })
    })
  })
  .command('init', 'Copy motion configuation files into the current directory', function(options: Object) {
    getMotion(options, currentDirectory, function(motion) {
      return motion.init().then(function() {
        motion.compilation.log(messageInit())
      })
    })
  })
  .command('build', 'Build dist files of the current motion app', function(options: Object) {
    getMotion(options, currentDirectory, function(motion) {
      return motion.build().then(function() {
        motion.compilation.log(messageBuild(Path.relative(currentDirectory, motion.config.outputDirectory)))
      })
    })
  })
  .command('watch', 'Make the Motion CLI run Dev server and watch the files for changes', function(options: Object) {
    getMotion(options, currentDirectory, function(motion) {
      return motion.watch()
    })
  })
  .default(function(options: Object) {
    getMotion(options, currentDirectory, function(motion) {
      return motion.watch()
    })
  })
  .process(process.argv)
