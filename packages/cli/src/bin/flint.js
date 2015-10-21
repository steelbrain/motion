#!/usr/bin/env node

var Program = require('commander');

// make `flint run` default command
var flintCmdIndex;
process.argv.forEach(function(arg, i) {
  if (arg.match(/flint?$/)) flintCmdIndex = i;
});

// make sure flags are still passed to `flint run`
var firstFlag = process.argv[flintCmdIndex + 1]

if (flintCmdIndex === process.argv.length - 1 || (firstFlag && firstFlag[0] === '-')) {
  process.flintArgs = [].concat(process.argv);
  process.flintArgs.splice(flintCmdIndex + 1, 0, 'run');
}

// check flint version
var path = require('path')
var exec = require('child_process').exec
var checkversion = 'npm view flint version'
exec(checkversion, (err, version) => {
  if (version) {
    var pkg = require(path.join('..', '..', '..', 'package.json'))

    const getversion = v => parseFloat((''+v).replace('.', ''))
    let curVersion = getversion(version)
    let pkgVersion = getversion(pkg.version)

    if (curVersion != pkgVersion) {
      console.log('Flint is out of date! `npm install -g flint` to update', pkgVersion, 'to', curVersion)
    }
  }
})

Program
  .version(require('../../../package.json').version)
  .command('new [name] [template]', 'start a new Flint app')
  .command('run', 'run your flint app')
  .command('build', 'run your flint app');

Program.parse(process.flintArgs || process.argv);
