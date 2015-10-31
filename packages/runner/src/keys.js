import open from 'open'
import keypress from 'keypress'

import log from './lib/log'
import openInBrowser from './lib/openInBrowser'
import editor from './lib/editor'
import opts from './opts'

const proc = process // cache for keypress

export function start() {
  let OPTS = opts.get()

  if (!proc.stdin.isTTY || OPTS.isBuild)
    return

  keypress(proc.stdin)

  // listen for the "keypress" event
  proc.stdin.on('keypress', async function (ch, key) {
    if (!key) return
    log('keypress', key.name)

    try {
      switch(key.name) {
        case 'o': // open browser
          openInBrowser(true)
          break
        case 'e': // open editor
          try {
            editor('.')
          }
          catch(e) {
            console.log('Error running your editor, make sure your shell EDITOR variable is set')
          }

          break
        case 'i': // install npm
          console.log('Installing npm packages...'.white.bold)
          await npm.install(true)
          console.log('Packages updated!'.green.bold)
          break
        case 'v': // verbose logging
          OPTS.verbose = !OPTS.verbose
          setLogging(OPTS)
          console.log(OPTS.verbose ? 'Set to log verbose'.yellow : 'Set to log quiet'.yellow, newLine)
          break
        case 'u': // upload
          // build(true)
          break
      }
    }
    catch(e) { handleError(e) }

    // exit
    if (key.ctrl && key.name == 'c')
      process.exit()
  });

  resume()
}

export function resume() {
  // listen for keys
  proc.stdin.setRawMode(true);
  proc.stdin.resume();
}

export function stop() {
  proc.stdin.setRawMode(false);
  proc.stdin.pause()
}

export default { start, resume, stop }