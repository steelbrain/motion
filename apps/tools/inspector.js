const setLocal = (k,v) =>
  localStorage.setItem(`__flint.state.${k}`, JSON.stringify(v))
const getLocal = (k,d) =>
  JSON.parse(localStorage.getItem(`__flint.state.${k}`)) || d

const round = Math.round

let highlighter

function positionHighlight(node) {
  const bounds = node.getBoundingClientRect()
  highlighter.setAttribute('style', `
    top: ${round(bounds.top)}px;
    left: ${round(bounds.left)}px;
    width: ${round(bounds.right - bounds.left)}px;
    height: ${round(bounds.bottom - bounds.top)}px;
  `)
}

function hideHighlight() {
  highlighter.setAttribute('style', '')
}

function findPath(node) {
  if (!node || !node.getAttribute) return null
  const flintid = node.__flintID
  if (!flintid) return findPath(node.parentNode)
  positionHighlight(node)
  return flintid
}

view Inspector {
  view.pause()

  let hudActive = false
  let showTemp = false
  let temp = null
  let views = []
  let clickOff
  let keys = {}
  let lastTarget = null
  let hoverOff

  on.mount(() => {
    if (highlighter) return
    highlighter = document.createElement('div')
    highlighter.className = "_flintHighlighter"
    document.body.appendChild(highlighter)
  })

  function inspect(path) {
    if (!path || path === temp) return
    _Flint.isInspecting = true
    temp = path
    view.update()
  }

  function mouseMove({ target }) {
    lastTarget = target
    if (hudActive) inspect(findPath(lastTarget))
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

  function hideHudTemporarily() {
    hideInspect()
    const offAgain = on.mousemove(() => {
      offAgain()
      if (hudActive)
        showInspect()
    })
  }

  function glue(e) {
    const path = findPath(e.target)

    hideHudTemporarily()

    /* toggle whether views has path */
    if (views.indexOf(path) > -1) {
      close(path)
    }
    else {
      views.push(path)
      view.update()
    }
    return false
  }

  const hover = () => {
    hoverOff = on.mousemove(window, mouseMove)
  }

  function showInspect() {
    inspect(findPath(lastTarget))
    hudActive = true
    hover()
    clickOff = on.click(window, glue)
  }

  function hideInspect(turnOffHud) {
    _Flint.isInspecting = false
    hideHighlight()
    hoverOff()
    clickOff()
    removeTemp()

    if (turnOffHud)
      hudActive = false
  }

  function writeBack(path, data) {
    const name  = data[1][0]
    const current = _Flint.getCache[path][name]
    let value = data[1][1]

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


  hover()

  const isAlt = cb => e => e.keyIdentifier === 'Alt' && cb()

  on.keydown(window, isAlt(showInspect))
  on.keyup(window, isAlt(hideInspect.bind(null, true)))

  <views>
    <Inspector.View
      repeat={views}
      path={_}
      writeBack={writeBack}
      onClose={e => close(_, e)}
    />
    <Inspector.View
      if={temp}
      path={temp}
      animate={true}
      writeBack={writeBack}
      onClose={removeTemp}
    />
  </views>

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 2
  }
}