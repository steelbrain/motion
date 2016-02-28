import path from 'path'
import opts from '../opts'
import log from './log'
import unicodeToChar from './unicodeToChar'

// TODO clean up error system in general
// This does stuff specific to things that pass in errors, it shouldn't

export default function logError(error, file) {
  if (!error) return

  print()

  if (typeof error != 'object' || Array.isArray(error))
    return print(error)

  if (error.message) {
    const message = error.message.replace(opts('appDir'), '')
    print('  ' + message.red)
  }

  if (error.loc)
    print('  line: %s, col: %s', error.loc.line, error.loc.column)

  error.stack = error.stack || error.codeFrame || ''
  error.stack = error.stack.split("\n").slice(0, 14).join("\n")

  if (error.stack)
    print(error.stack)

  if (file && typeof file == 'object')
    log('FILE', "\n", file.contents && file.contents.toString())

  print()
}
