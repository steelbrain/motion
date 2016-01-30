const browser = window._DT
const split = (s, i) => [s.substring(0, i), s.substring(i, i+1), s.substring(i+1)]

const isLive = () => browser.editor && browser.editor.live

// TODO make beautiful
let CUR_ERROR

function showFlintErrorDiv() {
  setTimeout(() => {
    // avoid showing if error fixed in meantime
    if (!CUR_ERROR) return

    const errors = document.querySelectorAll('.__flintError')
    if (!errors.length) return
    // add active class to show them
    ;[].forEach.call(errors, error => {
      if (error.className.indexOf('active') == -1)
        error.className += ' active'
    })
  }, isLive() ? 1000 : 100)
}

function niceRuntimeError(err) {
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

function niceNpmError({ msg, name }) {
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

const niceCompilerError = err =>
  niceCompilerMessage(fullStack(niceStack(err)))

const replaceCompilerMsg = (msg) => {
  if (!msg) return ''
  return msg
    .replace(/.*\.js\:/, '')
    .replace(/\([0-9]+\:[0-9]+\)/, '')
    .replace(/Line [0-9]+\:\s*/, '')
}

const niceCompilerMessage = err => {
  err.niceMessage = replaceCompilerMsg(err.message, err.fileName)
  return err
}

const matchErrorLine = /\>?\s*([0-9]*)\s*\|(.*)/g
const indicator = /\s*\|\s*\^\s*$/g

const fullStack = err => {
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

const niceStack = err => {
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

const log = (...args) => {
  if (false) console.log(...args)
}

view Errors {
  let error = null
  let compileError = null
  let runtimeError = null
  let npmError = null

  // only set error if there is an error, giving compile priority
  function setError() {
    if (compileError)
      error = niceCompilerError(compileError)
    else if (runtimeError)
      error = niceRuntimeError(runtimeError)
    else {
      error = null
    }

    CUR_ERROR = error

    log('tools: view.update()')
  }

  function close() {
    error = null
    compileError = null
    runtimeError = null
    npmError = null
  }

  browser.on('compile:error', () => {
    log('compile:error')
    compileError = browser.data.error
    setError()
  })

  browser.on('runtime:error', () => {
    // if (runtimeError) return // prefer first error
    runtimeError = browser.data
    log('runtime:error', runtimeError)
    setError()
  })

  browser.on('npm:error', () => {
    npmError = niceNpmError(browser.data.error)
    log('npm:error', npmError)
  })

  browser.on('runtime:success', () => {
    log('runtime:success')
    runtimeError = null
    npmError = null
    setError()
  })

  browser.on('compile:success', () => {
    log('compile:success')
    compileError = null
    npmError = null
    setError()
  })

  <ErrorMessage
    error={error}
    npmError={npmError}
    close={close}
  />
}

const flintAddedLines = 0
const last = arr => arr[arr.length - 1]
const fileName = url => url && url.replace(/[\?\)].*/, '')
const getLine = err => err && (err.line || err.loc && err.loc.line)

view ErrorMessage {
  let hasError = false
  let error = {}
  let npmError, fullStack
  let line = getLine(view.props.error)
  let clearDelay

  on.props(() => {
    clearDelay && clearDelay()

    npmError = view.props.npmError
    hasError = !!(view.props.error || view.props.npmError)
    error = view.props.error || error // keep old
    line = getLine(error)
    fullStack = null

    // show full stack after a delay
    if (error) {
      clearDelay = on.delay(2500, () => {
        if (hasError && error.fullStack) {
          fullStack = error.fullStack
        }
      })
    }
  })

  // update on editor state
  browser.emitter.on('editor:state', () => setTimeout(view.update))

  <Debounce
    // delay more during live typing
    delay={isLive() ? 2000 : 1000}
    force={hasError === false}
    showKey={fullStack || error && error.message}
    onUpdate={showFlintErrorDiv}
  >
    <bar>
      <Close onClick={view.props.close} size={35} />
      <inner if={npmError}>
        <where><flint>{npmError.name}</flint></where> {npmError.msg}
      </inner>

      <inner>
        <top>
          <where>
            <span>In <flint>{fileName(error.file)}</flint></span>
            <line>{line ? ' line' : ''} <flint if={line}>{line - flintAddedLines}</flint></line>
          </where>

          {' '}

          <shortError>
            {(error.niceMessage || error.message || '').trim()}
            <niceStack if={error.niceStack}>
              {error.niceStack[0]}
              <errCol>{error.niceStack[1]}</errCol>
              {error.niceStack[2]}
            </niceStack>
          </shortError>

          <help if={error.help}>
            {error.help}
          </help>
        </top>

        <fullStack if={fullStack}>
          <ln>{'' + fullStack[0]}</ln>
          <ln class="cur">{'' + fullStack[1]}</ln>
          <ln>{'' + fullStack[2]}</ln>
        </fullStack>
      </inner>
    </bar>
  </Debounce>

  const red = '#cd423e'

  $bar = {
    display: 'block',
    background: red,
    position: 'fixed',
    left: 0,
    bottom: hasError ? 0 : -100,
    transition: 'all 200ms ease-in',
    right: 0,
    fontFamily: '-apple-system, "San Francisco", Roboto, "Segou UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: 300,
    color: '#fff',
    fontSize: '14px',
    padding: 2,
    pointerEvents: 'all',
    overflow: 'scroll',
    zIndex: 2147483647,
    boxShadow: '0 -6px 12px rgba(0,0,0,0.06)',
  }

  $inner = {
    display: 'block',
    maxHeight: 200,
    overflowY: 'scroll'
  }

  $top = {
    padding: 8,
    display: 'block'
  }

  $where = {
    display: 'inline-block',
    pointerEvents: 'all',
    fontWeight: 300,
    color: 'rgba(255,255,255,0.8)',
  }

  $line = {
    display: 'inline-block',
    whiteSpace: 'pre',
    pointerEvents: 'all'
  }

  $flint = {
    display: 'inline',
    fontWeight: 700,
    color: '#fff'
  }

  $shortError = {
    display: 'inline',
    color: 'rgba(255,255,255,0.7)'
  }

  const stack = {
    color: 'rgba(255,255,255,0.85)',
    display: 'inline',
    fontFamily: 'Meslo, Menlo, Monaco, monospace',
    padding: [0, 5]
  }

  $niceStack = stack

  $cur = {
    background: '#fff'
  }

  $errCol = {
    display: 'inline',
    borderBottom: '2px solid #f5d64c',
    margin: -3,
    padding: 3,
    color: '#fff'
  }

  $fullStack = [stack, {
    maxHeight: fullStack ? 600 : 0,
    padding: fullStack ? [10, 0] : 0,
    transition: 'maxHeight ease-in 300ms',
    color: 'rgba(0,0,0,0.85)',
    background: 'rgba(255,255,255,0.9)',
    display: 'block',
    whiteSpace: 'pre',
    fontSize: 14,
    borderRadius: 3,
    margin: 2
  }]

  $ln = {
    padding: [0, 20]
  }

  $flintline = {
    whiteSpace: 'pre',
    pointerEvents: 'all',
    fontWeight: 'flint'
  }
}

view ErrorIcon {
  <svg viewBox="0 0 27.963 27.963">
    <path d="M13.983,0C6.261,0,0.001,6.259,0.001,13.979c0,7.724,6.26,13.984,13.982,13.984s13.98-6.261,13.98-13.984
      C27.963,6.259,21.705,0,13.983,0z M13.983,26.531c-6.933,0-12.55-5.62-12.55-12.553c0-6.93,5.617-12.548,12.55-12.548
      c6.931,0,12.549,5.618,12.549,12.548C26.531,20.911,20.913,26.531,13.983,26.531z" />
    <polygon points="15.579,17.158 16.191,4.579 11.804,4.579 12.414,17.158" />
    <path d="M13.998,18.546c-1.471,0-2.5,1.029-2.5,2.526c0,1.443,0.999,2.528,2.444,2.528h0.056c1.499,0,2.469-1.085,2.469-2.528
      C16.441,19.575,15.468,18.546,13.998,18.546z" />
  </svg>

  $svg = {
    width: 19,
    fill: 'red',
    margin: -4,
    marginLeft: 3,
    marginRight: 6,
    opacity: 0.9
  }
}
