const split = (s, i) => [s.substring(0, i), s.substring(i, i+1), s.substring(i+1)]
const propsMatch = /view\.props\./g
const propsReplace = String.fromCharCode('94')

const niceRuntimeError = err => {
  err.niceMessage = err.message
    .replace(/Uncaught .*Error:\s*/, '')
    .replace(propsMatch, propsReplace)
  return err
}

const niceCompilerError = err =>
  niceCompilerMessage(niceStack(err))

const replaceCompilerMsg = (msg, filename = '') =>
  msg
    .replace(filename + ': ', '')
    .replace(/identifier ([a-z]*)\s*Unknown global name/, '$' + '1 is not defined')
    .replace(/\([0-9]+\:[0-9]+\)/, '')
    .replace(/Line [0-9]+\:\s*/, '')
    .replace(/Flint.([A-Za-z1-9_]*)Wrapper/, '$' + '1')

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
        const matches = line.match(propsMatch).length
        if (matches) {
          result = result.replace(propsMatch, propsReplace)
          replacedChars += (matches * 10) // * len of replacement
        }

        result = result
          .replace(/\>\s*[0-9]+\s*\|\s*/g, '')

        result = replaceCompilerMsg(result)

        const colIndex = err.loc.column - 1
        const afterUnflintIndex = colIndex - replacedChars
        err.niceStack = split(result, afterUnflintIndex)
      }
    })
  }
  return err
}

view Errors {
  let error = null
  let compileError = null
  let runtimeError = null
  let errDelay = null

  /* only set error if there is an error,
     giving compile priority */
  const setError = () => {
    clearTimeout(errDelay)
    const noErrors = !compileError && !runtimeError

    if (noErrors) {
      error = null
      return
    }

    const delay = compileError ? 200 : 800
    errDelay = setTimeout(() => {
      if (runtimeError) {
        error = niceRuntimeError(runtimeError)
      }
      if (compileError) {
        error = niceCompilerError(compileError)
      }
    }, delay)
  }

  window._DT.on('compile:error', () => {
    runtimeError = null
    compileError = window._DT.data.error
    setError()
  })

  window._DT.on('runtime:error', () => {
    console.log("got runtime error", window._DT.data)
    // on multiple errors, prefer the first
    if (runtimeError) return
    compileError = null
    runtimeError = window._DT.data
    setError()
  })

  window._DT.on('runtime:success', () => {
    runtimeError = null
    setError()
  })

  window._DT.on('compile:success', () => {
    compileError = null
    setError()
  })

  <ErrorMessage error={error} />

  $div = {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%'
  }
}

view ErrorMessage {
  const last = arr => arr[arr.length - 1]
  const fileName = url => url && last(url.split('/'))
  const getLine = err => err && (err.line || err.loc && err.loc.line)
  const devHeight = 0 // 34 with bar
  const closedHeight = 55
  const openHeight = 200

  let open = false
  let line = getLine(^error)

  on('props', () => {
    line = getLine(^error)
  })

  <inner if={^error}>
    <where>
      {fileName(^error.file || ^error.fileName)}
      {line && ` line ${line}`}
    </where>
    {' '}
    <errorTitle>
      {^error.niceMessage || ^error.message}
      {^error.niceStack &&
        <niceStack>
          {^error.niceStack[0]}
          <errCol>{^error.niceStack[1]}</errCol>
          {^error.niceStack[2]}
        </niceStack>
      }
    </errorTitle>
  </inner>

  const red = '#C51E19'

  $ = {
    background: '#fff',
    borderTop: '1px solid #ddd',
    borderLeft: '4px solid ' + red,
    position: 'fixed',
    left: 0,
    height: open ? openHeight : 'auto',
    bottom: (^error) ? devHeight : (devHeight - closedHeight),
    transition: 'all 300ms ease-in',
    right: 0,
    fontFamily: 'helvetica',
    color: '#222',
    fontSize: 15,
    padding: 8,
    pointerEvents: 'all',
    overflow: 'scroll',
    zIndex: 2147483647
  }

  $inner = {
    display: 'block',
  }

  $where = {
    display: 'inline-block',
    fontSize: 15,
    pointerEvents: 'all',
    fontWeight: 'bold',
    color: red
  }

  $errorTitle = {
    display: 'inline'
  }

  $msg = {
    display: 'inline-block',
    fontSize: 16,
    fontWeight: 'bold',
    pointerEvents: 'all',
  }

  $niceStack = {
    opacity: 0.65,
    display: 'inline',
    fontFamily: 'Meslo, Menlo, Monaco, monospace',
    fontSize: 14,
    padding: [0, 5]
  }

  $errCol = {
    display: 'inline',
    background: 'red',
    borderBottom: '2px solid red',
    marginBottom: -2,
    color: 'white'
  }

  $stack = {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    maxHeight: 200
  }

  $line = {
    whiteSpace: 'pre',
    pointerEvents: 'all'
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
