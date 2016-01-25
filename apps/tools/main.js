import keycode from 'keycode'
window.___keycode = keycode

view Main {
  const internal = window.__isDevingDevTools
  let showInspector = true

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
