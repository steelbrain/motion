#!/usr/bin/env node

var Program = require('commander')
var colors = require('colors')

// check flint version
let path = require('path')
let exec = require('child_process').exec
let checkversion = 'npm view flint version -loglevel silent'

let pkg = require(path.join('..', '..', '..', 'package.json'))
const getversion = v => (''+v).trim()
let pkgV = getversion(pkg.version)

if (!pkgV.indexOf('beta'))
  exec(checkversion, (err, version) => {
    if (err) return
    if (version) {
      let curV = getversion(version)

      if (curV != pkgV) {
        console.log(
          `──────────────────────────────────\n`.yellow.bold +
          ` Flint update available: v${curV.slice(-8)} \n`.bold +
          `──────────────────────────────────`.yellow.bold
          `\n`,
          `Run flint update to get the new version`
        )
      }
    }
  })

Program
  .version(require('../../../package.json').version)
  .command('new [name] [template]', 'start a new Flint app')
  .command('run', 'run your flint app', { isDefault: true })
  .command('build', 'run your flint app')
  .command('update', 'update to the new flint cli')

Program.parse(process.flintArgs || process.argv)