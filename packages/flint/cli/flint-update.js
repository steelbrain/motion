console.log(`\nUpdating flint...\n`)

var colors = require('colors')
var execSync = require('child_process').execSync

let progValue = execSync('npm get progress').toString().trim()

// this makes npm faster
execSync('npm set progress=false')

// TODO make this smarter
console.log('Cleaning npm cache...')
execSync('npm cache clean --loglevel=error')

console.log('Updating flint on npm...')
execSync('npm install -g flint --loglevel=error')

execSync(`npm set progress=${progValue}`)