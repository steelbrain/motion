#!/usr/bin/env node

console.log(`\nUpdating flint...\n`)

var colors = require('colors')
var execSync = require('child_process').execSync

// TODO make this smarter
execSync('npm install -g flint')