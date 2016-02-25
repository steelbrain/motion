if (process.env.MOTION_DEBUG) {
  process.env.startedat = Date.now()
}

import Program from 'commander'
import colors from 'colors'
import { exec } from 'child_process'
import cmp from 'semver-compare'
import version from './lib/version'

const commands = [
  'run',
  'new',
  'build',
  'update',
  'init'
]

let [ node, motion, cmd = 'run', ...flags ] = process.argv

// motion --debug
if (cmd && cmd[0] == '-' && cmd != '--help') {
  flags = [cmd, ...flags]
  cmd = 'run'
}

// bad command
if (cmd && commands.indexOf(cmd) === -1) {
  cmd = '--help'
}

let args = [ node, motion, cmd, ...flags ]

// async check for new versions
exec('npm view motion@latest version -loglevel silent', (err, current) => {
  const outdated = (a, b) => cmp(a, b) == -1
  if (!err && version && outdated(version.trim(), current.trim()))
      console.log(
        `  Motion update available:`.yellow
        + ` v${version.trim()} -> v${current.trim()}`.dim
        + ` (motion update)`.dim
      )
})

Program
  .version(version)
  .command('run', 'run app, `motion` is a shortcut for this')
  .command('new [name] [template]', 'start a new app')
  .command('build', 'build for production')
  // .command('up', 'upload app to the web with Surge.sh')
  .command('update', 'update motion')
  .command('init', 'add a motion config to an existing app (temporary, awaiting https://github.com/motion/motion/issues/339)')

Program.parse(args)