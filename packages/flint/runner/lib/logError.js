import opts from '../opts'
import log from './log'
import unicodeToChar from './unicodeToChar'

export default function logError(error, file) {
  if (typeof error != 'object' || Array.isArray(error))
    return console.log(error)

  if (error.stack || error.codeFrame)
    error.stack = unicodeToChar(error.stack || error.codeFrame)

  if (error.plugin == 'gulp-babel') {
    console.log('Babel error')
    console.log(error.message.replace(opts('appDir'), ''))
    if (error.name != 'TypeError' && error.loc)
      console.log('line: %s, col: %s', error.loc.line, error.loc.column)

    if (error.stack)
      console.log("\n", error.stack.split("\n").slice(0, 7).join("\n"))

    return
  }

  if (error.message)
    console.log(error.message.red)

  if (error.stack)
    console.log(error.stack)

  if (file && typeof file == 'object')
    log('FILE', "\n", file.contents && file.contents.toString())
}
