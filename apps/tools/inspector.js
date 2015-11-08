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
  let temp = null
  let views = []
  let hoverOff, clickOff
  let keys = {}

  function inspect(e) {
    const path = findView(e.target)
    if (!path || path === temp) return 
    temp = path
    view.update()
  }
  
  function removeTemp() {
    temp = null
    view.update()
  }
  
  function close(path, e) {
    if (e) { e.stopPropagation() }
    
    views = views.filter(_id => _id != path)
    setTimeout(view.update, 100)
  }

  function glue(e) {
    const path = findView(e.target)
    
    /* toggle whether views has path */
    if (views.indexOf(path) > -1) {
      close(path)
    } else {
      views.push(path)
      view.update()
    }
    return false
  }

  function showInspect() {
    hoverOff = on(window, 'mousemove', inspect)
    clickOff = on(window, 'click', glue)
  }

  function hideInspect() {
    hoverOff()
    clickOff()
    removeTemp()
  }
  
  function write(path, data) {
    console.log('writing', path, data)
    const name  = data[1][0]
    const current = _Flint.getCache[path][name]
    let value = data[1][1]
    console.log('current is', current)
    
    if (typeof current == 'number') {
      value = +value
    }
    _Flint.setCache(path, name, value)
    _Flint.inspectorRefreshing = path
    _Flint.getInitialStates[path]()
    _Flint.viewsAtPath[path].forceUpdate()
    _Flint.inspectorRefreshing = null
    view.update()
  }

  const isAlt = cb => e => e.keyIdentifier === 'Alt' && cb()
  on(window, 'keydown', isAlt(showInspect))
  on(window, 'keyup', isAlt(hideInspect))

  <views>
    <Inspector.View
      repeat={views}
      path={_}
      writeBack={write}
      onClose={e => close(_, e)}
    />
    <br />
    <Inspector.View
      if={temp}
      path={temp}
      writeBack={write}
      onClose={removeTemp}
    />
  </views>

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 2
  }
}

