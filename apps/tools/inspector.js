const setLocal = (k,v) =>
  localStorage.setItem(`__flint.state.${k}`, JSON.stringify(v))
const getLocal = (k,d) =>
  JSON.parse(localStorage.getItem(`__flint.state.${k}`)) || d

function findView(node) {
  if (!node || !node.getAttribute) return null
  const flintid = node.__flintID
  if (flintid) return flintid
  else return findView(node.parentNode)
}

view Inspector {
  view.pause()

  let showTemp = false
  let views = []
  let hoverEvent, clickEvent
  let keys = {}

  function setView(path) {
    if (path) views.push(path)
  }

  function setTemp(path) {
    views[views.length - 1] = path
  }

  function inspect(e) {
    setTemp(findView(e.target))
  }

  function glue(e) {
    // off (hoverEvent)
    setView(findView(e.target))
    glued = true
  }

  function toggle() {
    showTemp = !showTemp

    if (showTemp) {
      setView('temp')
      hoverEvent = on(window, 'mousemove', inspect)
      clickEvent = on(window, 'click', glue)
    }
    else {
      views.pop()
      /* off(hoverEvent) // off(clickEvent) */
    }

    view.update()
  }

  function close(path) {
    views[path] = false
  }

  const toggleInspect = e => e.keyIdentifier === 'Alt' && toggle()
  on(window, 'keydown', toggleInspect)
  on(window, 'keyup', toggleInspect)

  <views repeat={views}>
    <Inspector.View
      path={_}
      onClose={close}
    />
  </views>

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 8
  }
}