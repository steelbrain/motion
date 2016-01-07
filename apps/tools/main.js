import keycode from 'keycode'
window.___keycode = keycode

function ifBeta(cb) {
  let checks = 0
  let stopID = setInterval(() => {
    if (checks > 20) clearInterval(stopID)
    if (typeof __flintopts !== 'undefined') {
      if (__flintopts.version.indexOf('beta') > -1) cb()
      clearInterval(stopID)
    }
    checks++
  }, 50)
}

view Main {
  const internal = window.__isDevingDevTools
  let showInspector = internal
  ifBeta(() => showInspector = true)

  <link rel="stylesheet" property="stylesheet" href="/__/tools/static/tools.css" />
  <link if={!internal} rel="stylesheet" property="stylesheet" href="/__/tools/styles.css" />

  <Errors />
  <Installer />
  <Menu if={showInspector} />
  <Inspector if={showInspector} />
  <StateTests if={internal} />

  $ = {
    position: 'fixed',
    pointerEvents: internal ? 'auto' : 'none',
    top: 0, left: 0,
    right: 0, bottom: 0,
    zIndex: 2147483647
  }
}
