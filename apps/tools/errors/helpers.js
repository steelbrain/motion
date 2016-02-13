export const browser = window._DT
export const isLive = () => browser.editor && browser.editor.live

const split = (s, i) => [s.substring(0, i), s.substring(i, i+1), s.substring(i+1)]

export function showFlintErrorDiv() {
  setTimeout(() => {
    // avoid showing if error fixed in meantime
    if (!browser.curError) return

    const errors = document.querySelectorAll('.__flintError')
    if (!errors.length) return
    // add active class to show them
    ;[].forEach.call(errors, error => {
      if (error.className.indexOf('active') == -1)
        error.className += ' active'
    })
  }, isLive() ? 1000 : 100)
}

export function niceRuntimeError(err) {
  if (err.file)
    err.file = err.file.replace(new RegExp('.*' + window.location.origin + '(\/[_]+\/)?'), '')

  if (err.file && err.file === 'flint.dev.js') {
    err.file = 'Flint'
    err.line = null
  }

  if (err.file && err.file.indexOf('internals.js') >= 0) {
    if (err.message && err.message.indexOf('Cannot find module') == 0) {
      const badModule = err.message.match(/(fs|path)/)

      if (badModule && badModule.length) {
        err.file = 'imported module:'
        err.message = `Cannot import node-only module: ${badModule[0]}`
      }
    }
    else {
      err.message = `Error in a locally required file. ${err.message}`
    }
  }

  if (err.message)
    err.niceMessage = err.message.replace(/Uncaught .*Error:\s*/, '')

  return err
}

export function niceNpmError({ msg, name }) {
  if (msg)
    msg = msg
      .replace(/(npm WARN.*\n|ERR\!)/g, '')
      .replace(/npm  argv.*\n/g, '')
      .replace(/npm  node v.*\n/g, '')
      .replace(/npm  npm.*\n/g, '')
      .replace(/npm  code.*\n/g, '')
      .replace(/npm  peerinvalid /g, '')
      .replace(/npm  404 /g, '')

  return { msg, name }
}

export const niceCompilerError = err =>
  niceCompilerMessage(fullStack(niceStack(err)))

const replaceCompilerMsg = (msg) => {
  if (!msg) return ''
  return msg
    .replace(/.*\.js\:/, '')
    .replace(/\([0-9]+\:[0-9]+\)/, '')
    .replace(/Line [0-9]+\:\s*/, '')
}

export const niceCompilerMessage = err => {
  err.niceMessage = replaceCompilerMsg(err.message, err.fileName)
  return err
}

const matchErrorLine = /\>?\s*([0-9]*)\s*\|(.*)/g
const indicator = /\s*\|\s*\^\s*$/g

function fullStack(err) {
  if (!err) return
  if (err.stack) {
    err.fullStack = ['', '', '']
    let index = 0
    err.stack.split("\n").forEach(line => {
      if (indicator.test(line)) return
      if (!matchErrorLine.test(line)) return
      let isLine = line[0] === '>'
      if (isLine) index = 1
      if (!isLine && index === 1) index = 2
      let result = line.replace(matchErrorLine, '$1$2').replace(/^(\s*[0-9]+\s*)[;]/, '$1 ')
      err.fullStack[index] += result + "\n"
    })
  }
  return err
}

function niceStack(err) {
  if (!err) return
  if (err.stack) {
    err.stack.split("\n").map(line => {
      if (line[0] === '>') {
        let result = line
        if (!result) return
        // remove the babel " > |" before the line
        result = result.replace(/\>\s*[0-9]+\s*\|\s*/, '')
        result = replaceCompilerMsg(result)
        const colIndex = err.loc.column - 4 // 4 because we remove babel prefix
        err.niceStack = split(result, colIndex)
      }
    })
  }
  return err
}

export const log = (...args) => {
  if (localStorage.getItem('flintdebug')) console.log(...args)
}
