'use strict'

import chalk from 'chalk'
import { CLI } from './cli'
import { run as runStartup, build } from './startup'
import server from './server'

// so we can easily weed out console.logs
// print = keep
// console.log = delete
global.print = console.log.bind(console)

async function run(options) {
  const cli = new CLI()
  cli.activate()
  await runStartup(options, cli)

  // Startup messages
  cli.log(chalk.green('Server running at') + ' ' + chalk.yellow('http://' + server.url()))

  cli.addCommand('open', 'Open this project in Browser', async function() {
    this.log('I should have opened this project in browser')
  })
  cli.addCommand('editor', 'Open this project in Atom', async function() {
    this.log('I should have opened this project in Atom')
  })
  cli.addCommand('build', 'Build dist files of your motion app', async function() {
    this.log('I should have built dist files of this app')
  })
  return cli
}

// TODO: This is for backward compatibility only, remove this in the upcoming future
export default { build, run }
