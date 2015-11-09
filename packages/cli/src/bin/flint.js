#!/usr/bin/env node

var Program = require('commander');

// make `flint run` default command
var flintIndex = getFlintIndex()

 // find where index of flint is
function getFlintIndex() {
  let index = 0
  for (let arg of process.argv) {
    if (arg.indexOf('flint') > 0)
      return index

    index++
  }
}

// make sure flags are still passed to `flint run`
var firstFlag = process.argv[flintIndex + 1]

if (flintIndex === process.argv.length - 1 || (firstFlag && firstFlag[0] === '-')) {
  process.flintArgs = [].concat(process.argv);
  process.flintArgs.splice(flintIndex + 1, 0, 'run');
}

// check flint version
var path = require('path')
var exec = require('child_process').exec
var checkversion = 'npm view flint version -loglevel silent'
exec(checkversion, (err, version) => {
  if (err) return
  if (version) {
    var pkg = require(path.join('..', '..', '..', 'package.json'))

    const getversion = v => parseFloat((''+v).replace('.', ''))
    let curVersion = getversion(version)
    let pkgVersion = getversion(pkg.version)

    if (curVersion != pkgVersion) {
      console.log('Flint update available', pkgVersion, 'to', curVersion)
    }
  }
})

Program
  .version(require('../../../package.json').version)
  .command('new [name] [template]', 'start a new Flint app')
  .command('run', 'run your flint app')
  .command('build', 'run your flint app');

Program.parse(process.flintArgs || process.argv);
