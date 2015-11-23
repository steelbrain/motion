export default function onError(Internal, Tools) {
  // used to prevent tons of logs during live development
  function onError(...args) {
    const isLive = Internal.editor.live

    if (isLive)
      return true
  }

  const origOnError = window.onerror
  window.onerror = (...args) => {
    origOnError && origOnError(...args)
    return onError(...args)
  }
}