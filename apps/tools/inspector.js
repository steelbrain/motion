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
  let hoverOff, clickOff
  let keys = {}

  function setView(path) {
    if (path) views.push(path)
  }

  function setTemp(path) {
    views[views.length - 1] = path
    view.update()
  }

  function inspect(e) {
    setTemp(findView(e.target))
  }

  function glue(e) {
    setView('temp')
  }

  function showInspect() {
    if (!showTemp) {
      showTemp = true
      setView('temp')
      hoverOff = on(window, 'mousemove', inspect)
      clickOff = on(window, 'click', glue)
    }
  }

  function hideInspect() {
    if (showTemp) {
      showTemp = false
      hoverOff()
      clickOff()
      views.pop() // remove temp
      view.update()
    }
  }

  function close(path) {
    views[path] = false
  }

  const isAlt = cb => e => e.keyIdentifier === 'Alt' && cb()
  on(window, 'keydown', isAlt(showInspect))
  on(window, 'keyup', isAlt(hideInspect))

  <views repeat={views}>
    <Inspector.View
      path={_}
      onClose={close}
    />
  </views>

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 2
  }
}