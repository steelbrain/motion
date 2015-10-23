const tools = window._DT
const split = (s, i) => [s.substring(0, i), s.substring(i, i+1), s.substring(i+1)]
const propsMatch = /view\.props\./g
const propsReplace = String.fromCharCode('94')

const niceRuntimeError = err => {
  err.file = err.file
    .replace(new RegExp('.*' + window.location.origin + '(\/\_\/)?'), '')

  console.log(err.file, err)
  err.niceMessage = err.message
    .replace(/Uncaught .*Error:\s*/, '')
    .replace(propsMatch, propsReplace)
  return err
}

const niceCompilerError = err =>
  niceCompilerMessage(niceStack(err))

const replaceCompilerMsg = (msg) =>
  msg
    .replace(/.*\.js\:/, '')
    .replace(/identifier ([a-z]*)\s*Unknown global name/, '$' + '1 is not defined')
    .replace(/\([0-9]+\:[0-9]+\)/, '')
    .replace(/Line [0-9]+\:\s*/, '')
    .replace(/Flint.([A-Za-z1-9_]*)Wrapper/, '$' + '1')
    .replace('view.render = () => ', '')
    .replace(' view={view}', '')

const niceCompilerMessage = err => {
  err.niceMessage = replaceCompilerMsg(err.message, err.fileName)
  return err
}

const niceStack = err => {
  if (err.stack) {
    err.stack.split("\n").forEach(line => {
      if (line[0] === '>') {
        let result = line
        let replacedChars = 0

        // this undoes flint stuff but keeps the highlighted area
        const matches = line.match(propsMatch)
        if (matches && matches.length) {
          result = result.replace(propsMatch, propsReplace)
          replacedChars += (matches.length * 10) // * len of replacement
        }

        // remove the babel " > |" before the line
        result = result
          .replace(/\>\s*[0-9]+\s*\|\s*/, '')

        result = replaceCompilerMsg(result)

        const colIndex = err.loc.column - 4 // 4 because we remove babel prefix
        const afterUnflintIndex = colIndex - replacedChars
        err.niceStack = split(result, afterUnflintIndex)
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
  let errDelay = null

  /* only set error if there is an error,
     giving compile priority */
  function setError() {
    clearTimeout(errDelay)
    const noErrors = !compileError && !runtimeError

    if (noErrors) {
      error = null
      view.update()
      return
    }

    const delay = compileError ? 200 : 800
    errDelay = setTimeout(() => {
      if (runtimeError)
        error = niceRuntimeError(runtimeError)
      if (compileError)
        error = niceCompilerError(compileError)
      view.update()
    }, delay)
  }

  function close() {
    error = null
    compileError = null
    runtimeError = null
    view.update()
  }

  tools.on('compile:error', () => {
    runtimeError = null
    compileError = tools.data.error
    setError()
  })

  tools.on('runtime:error', () => {
    if (runtimeError) return // prefer first error
    compileError = null
    runtimeError = tools.data
    setError()
  })

  tools.on('runtime:success', () => {
    runtimeError = null
    setError()
  })

  tools.on('compile:success', () => {
    compileError = null
    setError()
  })

  <ErrorMessage
    error={error}
    close={close}
    runtime={runtimeError}
    compile={compileError}
  />

  $div = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%'
  }
}

const flintAddedLines = 0
const last = arr => arr[arr.length - 1]
const fileName = url => url && url.replace(/[\?\)].*/, '')
const getLine = err => err && (err.line || err.loc && err.loc.line)

view ErrorMessage {
  let line = getLine(^error)

  on('props', () => {
    line = getLine(^error)
  })

  <Debounce force={!^error}>
    <bar>
      <inner if={^error}>
        <where>
          In <b>{fileName(^error.file)}</b>
          <line if={line}>
            <span>&nbsp;line</span> <b>{line - flintAddedLines}</b>
          </line>
        </where>
        {' '}
        <errorTitle>
          {(^error.niceMessage || ^error.message).trim()}
          <niceStack if={^error.niceStack}>
            {^error.niceStack[0]}
            <errCol>{^error.niceStack[1]}</errCol>
            {^error.niceStack[2]}
          </niceStack>
        </errorTitle>
        <close onClick={^close}><center>x</center></close>
      </inner>
    </bar>
  </Debounce>

  const red = '#cd423e'

  $bar = {
    background: red,
    position: 'fixed',
    left: 0,
    bottom: ^error ? 0 : -100,
    transition: 'all 200ms ease-in',
    right: 0,
    fontFamily: '-apple-system, "San Francisco", Roboto, "Segou UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: 300,
    color: '#fff',
    fontSize: '14px',
    padding: 10,
    pointerEvents: 'all',
    overflow: 'scroll',
    zIndex: 2147483647,
    boxShadow: '0 -6px 12px rgba(0,0,0,0.06)',
  }

  $inner = {
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
  
  $b = {
    color: '#fff'
  }

  $errorTitle = {
    display: 'inline',
    color: 'rgba(255,255,255,0.7)'
  }

  $niceStack = {
    color: 'rgba(255,255,255,0.85)',
    display: 'inline',
    fontFamily: 'Meslo, Menlo, Monaco, monospace',
    padding: [0, 5]
  }

  $errCol = {
    display: 'inline',
    borderBottom: '2px solid #f5d64c',
    margin: -3,
    padding: 3,
    color: '#fff'
  }

  $stack = {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    maxHeight: 200
  }

  $boldline = {
    whiteSpace: 'pre',
    pointerEvents: 'all',
    fontWeight: 'bold'
  }

  $close = {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 1,
    opacity: 0.5,
    cursor: 'pointer',

    ':hover': {
      opacity: 1
    }
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
