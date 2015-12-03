import reportError from '../lib/reportError'

// Why named flint?? Because it shows in console.log a lot

// fancy (someday) error handling that works with live
// coding to be smart enough to avoid sending tons of error messages

export default function onError(Internal, Tools) {
  if (Internal.isDevTools) return

  const origOnError = window.onerror
  let sinceLastErr = Date.now()
  let timeout

  // used to prevent tons of logs during live development
  function onError(...args) {
    // send error to dev tools error bar
    const flintShowError = () => reportError(...args)

    Internal.runtimeErrors++ // for use in detecting if we've started up with errors
    const isLive = Internal.editor.live
    console.log('isLive', isLive)

    if (isLive) {
      let now = Date.now()
      let isFast = now - sinceLastErr < 1000
      sinceLastErr = now

      // hide if happening often
      if (isFast) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          // if weve ran successfully in between this timeout, dont show err!
          if (Internal.lastFileLoad > now) {
            console.log('Ran successfully')
            return
          }

          flintShowError()

          // DEBUGGING PERSON: open your stack trace and look @ first file to find real line #
          // these weird logs only happen during live coding when you type quickly, to prevent
          // *hundreds* of error logs happening.
          console.error(args[4].stack)
        }, 1500)

        return true
      }
    }
    else {
      flintShowError()
    }
  }

  window.onerror = (...args) => {
    origOnError && origOnError(...args)
    return onError(...args)
  }
}