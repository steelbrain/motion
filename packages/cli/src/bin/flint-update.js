#!/usr/bin/env node

console.log(`\nUpdating flint...\n`)

var colors = require('colors')
var exec = require('child_process').exec

exec('npm update -g flint@beta')