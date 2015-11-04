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
    console.log(views)
  }

  function inspect(e) {
    setTemp(findView(e.target))
  }

  function glue(e) {
    // off (hoverOff)
    views.pop() //remove temp
    setView(findView(e.target))
    glued = true
  }

  function toggle() {
    showTemp = !showTemp

    if (showTemp) {
      setView('temp')
      hoverOff = on(window, 'mousemove', inspect)
      clickOff = on(window, 'click', glue)
    }
    else {
      views.pop()
      hoverOff()
      clickOff()
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
    <test>{console.log('he',_)}</test>
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