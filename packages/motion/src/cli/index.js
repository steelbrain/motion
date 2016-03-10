#!/usr/bin/env node

const Motion = require('../')
const motion = new Motion({
  rootDirectory: process.cwd()
})

console.log('Initializing Motion app for you')
motion.init()
