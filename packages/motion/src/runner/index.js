'use strict'

import { CLI } from './cli'
import { run as runStartup, build } from './startup'

// so we can easily weed out console.logs
// print = keep
// console.log = delete
global.print = console.log.bind(console)

async function run(options) {
  const cli = new CLI()
  cli.activate()
  await runStartup(options, cli)
  cli.addCommand('build', 'Build dist files of your motion app', async function() {
    this.log('You asked me to build it')
  })
  return cli
}

// TODO: This is for backward compatibility only, remove this in the upcoming future
export default { build, run }
