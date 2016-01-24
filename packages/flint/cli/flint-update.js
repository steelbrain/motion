console.log(`\nUpdating flint...\n`)

var colors = require('colors')
var execSync = require('child_process').execSync

// TODO make this smarter
console.log('Cleaning npm cache...')
execSync('npm cache clean --loglevel=error')

console.log('Updating flint on npm...')
execSync('npm install -g flint --loglevel=error')