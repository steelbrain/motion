var Program = require('commander')
var colors = require('colors')

// flint --help
var isFlintHelp = process.argv.length == 3 && process.argv[2] == '--help'

if (!isFlintHelp) {
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
}

// check flint version
let path = require('path')
let exec = require('child_process').exec
let checkversion = 'npm view flint@latest version -loglevel silent'

// TODO use json reader
let pkg = require('../package.json')
const getversion = v => (''+v).trim()
let pkgV = getversion(pkg.version)

exec(checkversion, (err, version) => {
  if (err) return
  if (version) {
    let curV = getversion(version)

    if (curV != pkgV) {
      console.log(
        `\n──────────────────────────────────\n`.yellow.bold +
        ` Flint update available: v${curV} \n`.bold +
        `──────────────────────────────────\n`.yellow.bold
      )
    }
  }
})

Program
  .version(pkgV)
  .command('run', 'run app, `flint` is a shortcut for this')
  .command('new [name] [template]', 'start a new app')
  .command('build', 'build your app to .flint/build')
  // .command('up', 'upload app to the web with Surge.sh')
  .command('update', 'update flint')

Program.parse(process.flintArgs || process.argv)