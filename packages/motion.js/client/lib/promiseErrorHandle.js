import reportError from './reportError'

if (typeof window == 'undefined') {
  process.on("unhandledRejection", function(reason, promise) {
    reportError(reason)
    throw reason
  })
}
else {
  window.addEventListener("unhandledrejection", function(e) {
    e.preventDefault()
    var reason = e.detail.reason
    reportError(reason)
    throw reason
  })
}