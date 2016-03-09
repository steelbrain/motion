import chalk from 'chalk'
import server from './server'
import shutdown from './shutdown'
import open from 'open'
import keypress from 'keypress'
import { surge } from './lib/requires'
import { _, emitter } from './lib/fns'
import log from './lib/log'
import openInBrowser from './lib/openInBrowser'
import handleError from './lib/handleError'
import editor from './lib/editor'
import opts from './opts'
import bundler from './bundler'
import builder from './builder'
import { build } from './startup'
import cache from './cache'

const proc = process // cache for keypress

let stopped = false

export function init() {
  if (!proc.stdin.setRawMode) return
  start()
  banner()
}

function promptItem(message, color) {
  return `${message.slice(0, 4)}${chalk.bold(message[4])}${message.slice(5)}`
}

let starts = (a, b) => a % b == 0

function promptLayout(messages, { perLine = 2, prefix = '  › ', pad = 12 }) {
  let item = (str, color) => promptItem(_.padEnd(`${prefix}${str}`, pad))

  return messages.map((message, i) =>
    starts(i, perLine) ? chalk.yellow(`\n${item(message)}`) : chalk.dim(item(message))
  ).join('')
}

export function banner() {
  const newLine = "\n"
  const userEditor = (process.env.VISUAL || process.env.EDITOR)

  print(`\n  http://${server.url()}`.green)

  const messages = [
    'Open', 'Verbose', 'Build',
    'Editor', 'Rebundle'
  ]

  if (opts('build') && opts('watch'))
    messages.push('Upload')

  // print('  Shortcuts')
  print(promptLayout(messages, { perLine: 3 }))
  print()

  resume()
}

function start() {
  let OPTS = opts()

  if (!proc.stdin.isTTY || (OPTS.build && !OPTS.watch))
    return

  keypress(proc.stdin)

  let building = false

  // listen for the "keypress" event
  proc.stdin.on('keypress', async function (ch, key) {
    if (!key) return
    if (stopped) return

    log('keypress', key.name)

    try {
      switch(key.name) {
        case 'return': // show banner again
          banner()
          break
        case 'b':
          await builder.build()
          break
        case 'o': // open browser
          openInBrowser(true)
          break
        case 'e': // open editor
          try {
            editor('.')
          }
          catch(e) {
            print('Error running your editor, make sure your shell EDITOR variable is set')
          }

          break
        case 'r': // bundler
          print('  Bundling internals / npm packages...'.dim)
          await bundler.all({ force: true })
          print(`  Bundled!\n`.green.bold)
          break
        case 'v': // verbose logging
          opts.set('debug', !opts('debug'))
          log.setLogging()
          print(opts('debug') ? 'Set to log verbose'.yellow : 'Set to log quiet'.yellow, "\n")
          break
        case 'u': // upload
          if (building) return

          if (opts('run')) {
            building = true
            print('\n  Building for production...')
            await build({ once: true })
            building = false
          }

          if (opts('build') && opts('watch')) {
            let Surge = surge()
            const surge = Surge({ platform: 'motion.love', input: proc.stdin, output: proc.stdout })

            print(`\n  Publishing to surge...`)
            stop()
            proc.stdout.isTTY = false
            surge.publish({
              postPublish() {
                print('🚀🚀🚀🚀')
                resume()
              }
            })({})
            proc.stdout.isTTY = true
          }
          break
        case 'd':
          emitter.emit('debug')
          break
      }
    }
    catch(e) {
      handleError(e)
    }

    // exit
    if (key.ctrl && key.name == 'c') {
      shutdown.now()
    }
  })

  resume()
}

export function resume() {
  // listen for keys
  proc.stdin.setRawMode(true)
  proc.stdin.resume()
  stopped = false
}

export function stop() {
  proc.stdin.setRawMode(false)
  proc.stdin.pause()
  stopped = true
}

export default {
  init,
  banner,
  resume,
  stop
}
