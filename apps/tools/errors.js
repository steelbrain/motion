const tools = window._DT
const split = (s, i) => [s.substring(0, i), s.substring(i, i+1), s.substring(i+1)]

const niceRuntimeError = err => {
  if (err.file)
    err.file = err.file.replace(new RegExp('.*' + window.location.origin + '(\/[_]+\/)?'), '')

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

const niceNpmError = ({ msg, name }) => {
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
      let onLine = line[0] === '>'
      if (onLine) index = 1
      if (!onLine && index === 1) index = 2
      let result = line.replace(matchErrorLine, '$1$2')
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

view Errors {
  view.pause()

  let error = null
  let compileError = null
  let runtimeError = null
  let npmError = null

  /* only set error if there is an error,
     giving compile priority */
  function setError() {
    if (compileError)
      error = niceCompilerError(compileError)
    else if (runtimeError)
      error = niceRuntimeError(runtimeError)
    else {
      error = null
    }

    view.update()
  }

  function close() {
    error = null
    compileError = null
    runtimeError = null
    npmError = null
    view.update()
  }

  tools.on('compile:error', () => {
    compileError = tools.data.error
    setError()
  })

  tools.on('runtime:error', () => {
    // if (runtimeError) return // prefer first error
    runtimeError = tools.data
    setError()
  })

  tools.on('npm:error', () => {
    npmError = niceNpmError(tools.data.error)
    view.update()
  })

  tools.on('runtime:success', () => {
    runtimeError = null
    npmError = null
    setError()
  })

  tools.on('compile:success', () => {
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
  let error, npmError, fullStack
  let line = getLine(view.props.error)

  on.props(() => {
    npmError = view.props.npmError
    error = view.props.error
    line = getLine(error)
    fullStack = null

    // show full stack after a delay
    if (error)
      on.delay(2500, () => {
        if (error) fullStack = error.stack
      })
  })

  function showFlintErrorDiv() {
    setTimeout(() => {
      const errorDiv = document.getElementById('FLINTERROR')
      if (errorDiv) errorDiv.className = 'active'
    })
  }

  <Debounce force={!error} onUpdate={showFlintErrorDiv}>
    <bar>
      <Close onClick={view.props.close} size={35} />

      <inner if={npmError}>
        <where><b>{npmError.name}</b></where> {npmError.msg}
      </inner>

      <inner if={error}>
        <where>
          In <b>{fileName(error.file)}</b>
          <line if={line}>
            <span>&nbsp;line</span> <b>{line - flintAddedLines}</b>
          </line>
        </where>

        {' '}

        <shortError>
          {(error.niceMessage || error.message).trim()}
          <niceStack if={error.niceStack}>
            {error.niceStack[0]}
            <errCol>{error.niceStack[1]}</errCol>
            {error.niceStack[2]}
          </niceStack>
        </shortError>

        <help if={error.help}>
          {error.help}
        </help>

        <fullStack if={error.fullStack}>
          <ln>{error.fullStack[0]}</ln>
          <ln class="cur">{error.fullStack[1]}</ln>
          <ln>{error.fullStack[2]}</ln>
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
    bottom: view.props.error ? 0 : -100,
    transition: 'all 200ms ease-in',
    right: 0,
    fontFamily: '-apple-system, "San Francisco", Roboto, "Segou UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: 300,
    color: '#fff',
    fontSize: '14px',
    padding: 8,
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

  $b = {
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
    background: 'rgb(253, 255, 237)'
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
    color: 'rgba(150,0,0,0.85)',
    background: '#fff',
    display: 'block',
    whiteSpace: 'pre',
    margin: [10, -10, -10],
    fontSize: 14
  }]

  $ln = {
    padding: [0, 20]
  }

  $boldline = {
    whiteSpace: 'pre',
    pointerEvents: 'all',
    fontWeight: 'bold'
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
