import keycode from 'keycode'

window.___keycode = keycode

const keysCorrect = ({ altKey, metaKey }) => altKey && !metaKey

let offAlt = null
function checkInspect(e) {
  if (keysCorrect(e)) {
    // wait a little so were not toooo eager
    offAlt = on.delay(180, () => {
      if (keysCorrect(e)) { on.event('hud:show') }
    })
  } else {
    offAlt && offAlt()
    on.event('hud:hide')
  }
}

on.keydown(window, checkInspect)
on.keyup(window, checkInspect)

view Main {
  const internal = window.__isDevingDevTools
  let showInspector = true

  <link rel="stylesheet" property="stylesheet" href="/__/tools/static/tools.css" />
  <link if={!internal} rel="stylesheet" property="stylesheet" href="/__/tools/styles.css" />

  <Errors />
  <Installer />
  <DevBar />
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
