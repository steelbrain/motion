#!/usr/bin/env node

// NOTE: To allow `pidof motion`
process.title = 'motion'

const Motion = require('../')

Motion.create({
  rootDirectory: process.cwd()
}).then(function(motion) {
  console.log('Initializing Motion app for you')
  motion.init()
}).catch(e => console.error(e))
