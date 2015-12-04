export default function logError(error, file) {
  if (typeof error == 'string')
    console.log(error)

  if (error.stack || error.codeFrame)
    error.stack = unicodeToChar(error.stack || error.codeFrame);

  if (error.plugin == 'gulp-babel') {
    console.log(error.message.replace(OPTS.appDir, ''));
    if (error.name != 'TypeError' && error.loc)
      console.log('line: %s, col: %s', error.loc.line, error.loc.column);
    console.log(newLine, error.stack.split("\n").splice(0, 7).join("\n"))
  }
  else {
    // console.log('ERROR', "\n", JSON.stringify(error))
    log('FILE', "\n", file.contents.toString())
  }
}
