export default function init(Internal) {
  root.onerror = flintOnError

  function flintOnError(...args) {
    reportError(...args)

    // suppress if live editing
    // if (Internal.editor.live === true)
    //   return true

    // restore last working views
    if (!Internal.firstRender)
      Object.keys(Internal.views).forEach(name => {
        Internal.views[name] = Internal.lastWorkingViews[name]
      })
  }
}