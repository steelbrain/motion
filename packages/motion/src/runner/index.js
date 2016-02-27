'use strict'

import { CLI } from './cli'
import { run as runStartup, build } from './startup'

// so we can easily weed out console.logs
// print = keep
// console.log = delete
global.print = console.log.bind(console)

async function run() {
  const cli = new CLI()
  cli.activate()
  return cli
}

// TODO: This is for backward compatibility only, remove this in the upcoming future
export default { build, run }
