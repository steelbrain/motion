import Program from 'commander'
import colors from 'colors'
import path from 'path'
import { exec } from 'child_process'
import cmp from 'semver-compare'
import findIndex from 'lodash/findIndex'
import { version } from '../package.json'

let args = process.argv // ['...node', '...flint', 'cmd', '--flag', ...]
let cmd = args[2]

// flint == flint run
if (cmd != '--help') {
  args[2] = `run`
}

// async check for new versions
exec('npm view flint@latest version -loglevel silent', (err, current) => {
  const outdated = (a, b) => cmp(a, b) == -1
  if (!err && version && outdated(version.trim(), current.trim()))
      console.log(` Update available: v${current} \n`.bold)
})

Program
  .version(version)
  .command('run', 'run app, `flint` is a shortcut for this')
  .command('new [name] [template]', 'start a new app')
  .command('build', 'build your app to .flint/build')
  // .command('up', 'upload app to the web with Surge.sh')
  .command('update', 'update flint')

Program.parse(args)