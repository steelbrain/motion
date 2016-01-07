#!/usr/bin/env node

var Program = require('commander')
var colors = require('colors')

/* START -- make `flint run` default command -- */
var flintIndex = getFlintIndex()
 // find where index of flint is
function getFlintIndex() {
  let index = 0
  for (let arg of process.argv) {
    if (arg.indexOf('flint') > 0) return index
    index++
  }
}
// make sure flags are still passed to `flint run`
var firstFlag = process.argv[flintIndex + 1]
if (flintIndex === process.argv.length - 1 || (firstFlag && firstFlag[0] === '-')) {
  process.flintArgs = [].concat(process.argv);
  process.flintArgs.splice(flintIndex + 1, 0, 'run');
}
/* END -- make `flint run` default command -- */

// check flint version
let path = require('path')
let exec = require('child_process').exec
let checkversion = 'npm view flint version -loglevel silent'

let pkg = require(path.join('..', '..', 'package.json'))
const getversion = v => (''+v).trim()
let pkgV = getversion(pkg.version)

exec(checkversion, (err, version) => {
  if (err) return
  if (version) {
    let curV = getversion(version)

    if (curV != pkgV) {
      console.log(
        `──────────────────────────────────\n`.yellow.bold +
        ` Flint update available: v${curV} \n`.bold +
        `──────────────────────────────────`.yellow.bold
      )
    }
  }
})

Program
  .version(require('../../package.json').version)
  .command('new [name] [template]', 'start a new Flint app')
  .command('run', 'run your flint app')
  .command('build', 'run your flint app')
  .command('update', 'update to the new flint cli')
  .command('*', () => {
    console.log('what')
  })

Program.parse(process.flintArgs || process.argv)