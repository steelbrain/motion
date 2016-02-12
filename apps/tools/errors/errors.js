import {
  browser,
  isLive,
  showFlintErrorDiv,
  niceRuntimeError,
  niceNpmError,
  niceCompilerError,
  niceCompilerMessage,
  log
} from './helpers'

view Errors {
  let error = null //{ message: "hello", file: 'where' }
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

    browser.curError = error
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

  <Errors.Message
    error={error}
    npmError={npmError}
    close={close}
  />
}