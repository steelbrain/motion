import opts from '../opts'
import log from './log'
import unicodeToChar from './unicodeToChar'

export default function logError(error, file) {
  console.log()

  if (typeof error != 'object' || Array.isArray(error))
    return console.log(error)

  if (error.message)
    console.log('  ' + unicodeToChar(error.message.replace(opts('appDir'), '').red))

  if (error.loc)
    console.log('  line: %s, col: %s', error.loc.line, error.loc.column)

  if (error.stack && error.plugin != 'gulp-babel')
    console.log(error.stack)

  error.stack = error.stack || error.codeFrame || ''
  error.stack = unicodeToChar(error.stack)

  if (error.plugin == 'gulp-babel')
    error.stack = error.stack ? error.stack.split("\n").slice(0, 7).join("\n") : ''

  if (error.stack)
    error.stack = unicodeToChar(error.stack)

  if (file && typeof file == 'object')
    log('FILE', "\n", file.contents && file.contents.toString())

  console.log()
}
