if (process.env.FLINT_DEBUG) {
  process.env.startedat = Date.now()
}

import Program from 'commander'
import colors from 'colors'
import { exec } from 'child_process'
import cmp from 'semver-compare'
import version from './lib/flintVersion'

const commands = [
  'run',
  'new',
  'build',
  'update'
]

let [ node, flint, cmd = 'run', ...flags ] = process.argv

// flint --debug
if (cmd && cmd[0] == '-' && cmd != '--help') {
  flags = [cmd, ...flags]
  cmd = 'run'
}

// bad command
if (cmd && commands.indexOf(cmd) === -1) {
  cmd = '--help'
}

let args = [ node, flint, cmd, ...flags ]

// async check for new versions
exec('npm view flint@latest version -loglevel silent', (err, current) => {
  const outdated = (a, b) => cmp(a, b) == -1
  if (!err && version && outdated(version.trim(), current.trim()))
      console.log(
        `  Flint update available:`.yellow
        + ` v${version.trim()} -> v${current.trim()}`.dim
        + ` (flint update)`.dim
      )
})

Program
  .version(version)
  .command('run', 'run app, `flint` is a shortcut for this')
  .command('new [name] [template]', 'start a new app')
  .command('build', 'build for production')
  // .command('up', 'upload app to the web with Surge.sh')
  .command('update', 'update flint')

Program.parse(args)