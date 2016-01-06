#!/usr/bin/env node

console.log(`\nUpdating flint...\n`)

var colors = require('colors')
var exec = require('child_process').execSync

execSync('npm update -g flint@beta')