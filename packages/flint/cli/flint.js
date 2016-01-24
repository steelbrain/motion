import Program from 'commander'
import colors from 'colors'
import { exec } from 'child_process'
import cmp from 'semver-compare'
import { version } from '../package.json'

let [ node, flint, cmd = 'run', ...flags ] = process.argv

// pass flags to run
if (cmd[0] == '-' && cmd != '--help') {
  flags = [].concat(cmd, flags)
  cmd = 'run'
}

let args = [ node, flint, cmd, ...flags ]

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