'use strict'

import Path from 'path'
import open from 'open'
import chalk from 'chalk'
import { exec } from 'sb-exec'
import { CLI } from './cli'
import { run as runStartup, build } from './startup'
import server from './server'
import builder from './builder'
import { realPath, exists, readFile } from './lib/fs'
import { get as getOption } from './opts'

// print - so we can easily weed out console.logs
global.print = console.log.bind(console)

async function run(options) {
  const showUI = process.stdin.isTTY
  let cli

  if (showUI) {
    cli = new CLI()
    cli.activate()
    // Make printing go to our shiny UI
    global.print = function() {
      cli.log(...arguments)
    }
    // Startup messages
    await runStartup(options, cli)
    cli.log(chalk.green('Server running at') + ' ' + chalk.yellow('http://' + server.url()))

    cli.addCommand('open', 'Open this project in Browser', async function() {
      open('http://' + server.url())
    })
    cli.addCommand('editor', 'Open this project in Atom', async function() {
      const directory = await realPath(process.cwd())
      await exec('atom', [directory])
    })
    cli.addCommand('build', 'Build dist files of your motion app', async function() {
      await builder.build()
    })

    const manifestPath = Path.join(getOption('appDir'), 'package.json')
    const manifestExists = await exists(manifestPath)
    if (manifestExists) {
      const manifestContents = JSON.parse((await readFile(manifestPath)))
      if (manifestContents.scripts && typeof manifestContents.scripts)
      for (const name in manifestContents.scripts) {
        const command = manifestContents.scripts[name]
        cli.addCommand(`run-${name.replace(/ /g, '-')}`, 'Execute the npm script', async function() {
          await exec(process.env.SHELL, ['-c', command], { stream: 'both', 'stdio': 'inherit' })
        })
      }
    }
  } else {
    await runStartup(options, cli)
  }
}

// TODO: This is for backward compatibility only, remove this in the upcoming future
export default { build, run }
