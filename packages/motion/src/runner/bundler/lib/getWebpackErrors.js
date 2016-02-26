import opts from '../../opts'
import { p, path, log, _ } from '../../lib/fns'

let lineSep = `\n  `
let takeWebpack = ls => lineSep + _.take(ls, 10).join(lineSep)
let split = s => s.split("\n")
let join = s => s.join("\n")

function cleanPath(str) {
  return str
    .trim()
    .replace(/\.\/\.motion(\/\.internal)?(\/deps(\/internal)?)?/g, '')
    .replace(new RegExp(opts('appDir'), 'g'), '')
    .replace(new RegExp('Module not found: ', 'g'), '')
    .replace('in /' + path.relative(opts('appDir'), opts('deps').dir), '') // webpack remove "in /deps/externals.in.js"
    .replace("/externals.in.js\n", '')
    .replace("/internals.in.js\n", '')
}

export default function getWebpackErrors(where, err, stats) {
  if (err) return err

  const jsonStats = !stats.toJson ? stats : stats.toJson({
    source: false
  })

  // check errors
  let errors = jsonStats.errors

  if (errors.length) {
    // debug output everything
    log.webpack('webpackErrors', errors.join("\n"))

    let messages = errors.map(split).map(takeWebpack)[0].dim
    let whereMsg = where == 'externals' ? 'NPM modules' : 'imported local modules'
    let message = cleanPath(`Webpack: ${whereMsg}`.yellow + `  ${messages}`).grey

    let file, line, column

    // this is ridiculous, but webpack only gives us errors as a big string stack dump
    // with the file at the bottom and line number at the end
    try {
      const lastError = errors[errors.length - 1].split("\n")
      const fileAndLine = cleanPath(lastError[lastError.length - 1]).split(' ') // on last line of webpack error

      if (fileAndLine.length > 2) {
        file = fileAndLine[1]
        line = fileAndLine[2].split(':')[0]
        column = fileAndLine[2].split(':')[1]
      }
    }
    catch(e) {
      return e
    }

    // rather than error out and break startup of app from running,
    // we just log directly but continue
    return { message, file, loc: { line, column } }
  }

  // check warnings
  if (jsonStats.warnings.length) {
    print('Webpack warnings: ', jsonStats.warnings[0].split("\n").slice(0, 3).join("\n"))
  }

  log.webpack('webpack finished')
}
