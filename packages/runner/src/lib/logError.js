import opts from '../opts'
import log from './log'
import unicodeToChar from './unicodeToChar'

export default function logError(error, file) {
  if (typeof error == 'string')
    console.log(error)

  if (error.stack || error.codeFrame)
    error.stack = unicodeToChar(error.stack || error.codeFrame);

  if (error.plugin == 'gulp-babel') {
    console.log(error.message.replace(opts.get('appDir'), ''));
    if (error.name != 'TypeError' && error.loc)
      console.log('line: %s, col: %s', error.loc.line, error.loc.column);
    console.log("\n", error.stack.split("\n").splice(0, 7).join("\n"))
  }
  else {
    // console.log('ERROR', "\n", JSON.stringify(error))
    if (file && typeof file == 'object')
      log('FILE', "\n", file.contents && file.contents.toString())
  }
}
