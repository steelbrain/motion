const isAlt = cb => e => e.keyIdentifier === 'Alt' && cb()
const isEsc = cb => e => e.keyCode === 27 && cb()

const setLocal = (k,v) =>
  localStorage.setItem(`__flint.state.${k}`, JSON.stringify(v))
const getLocal = (k,d) =>
  JSON.parse(localStorage.getItem(`__flint.state.${k}`)) || d

const Internal = window._Flint
const round = Math.round

let highlighter

function positionHighlight(node) {
  const bounds = node.getBoundingClientRect()
  const winW = window.innerWidth
  const winH = window.innerHeight
  const width = round(bounds.right - bounds.left)
  const height = round(bounds.bottom - bounds.top)
  let opacity = 1

  if (width >= winW && height >= winH)
    opacity = 0.2

  highlighter.setAttribute('style', `
    top: ${round(bounds.top)}px;
    left: ${round(bounds.left)}px;
    width: ${width}px;
    height: ${height}px;
    opacity: ${opacity};
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

function tempActive(views) {
  return views.filter(v => !v.temp).length > 0
}

function pathActive(views, path) {
  return views.filter(v => v.path == path).length > 0
}

function removeTemp(views) {
  return views.filter(v => !v.temp).map(v => ({ ...v, highlight: false }))
}

function setClosing(views) {
  return views.map(v => {
    if (v.path == path) { v.closing = true }
    return v
  })
}

function toggleView(views, path) {
  if (pathActive(views, path)) {
    return views.map(v => {
      if (v.path == path) v.temp = true
      return v
    })
  }
  else {
    return [].concat(views, [{ temp: false, highlight: false, closing: false, path }])
  }
}

function writeBack(path, data) {
  const name  = data[1][0]
  const current = Internal.getCache[path][name]
  let value = data[1][1]

  if (typeof current == 'number') {
    value = +value
  }

  Internal.setCache(path, name, value)
  Internal.inspectorRefreshing = path
  Internal.getInitialStates[path]()
  Internal.viewsAtPath[path].forceUpdate()
  Internal.inspectorRefreshing = null
}

view Inspector {
  view.pause()

  let hudActive = false
  let views = []
  let clickOff
  let keys = {}
  let lastTarget = null
  let hoverOff

  on.mount(() => {
    hoverOff = on.mousemove(window, mouseMove)
    if (highlighter) return
    highlighter = document.createElement('div')
    highlighter.className = "_flintHighlighter"
    document.body.appendChild(highlighter)
  })

  function inspect(target) {
    Internal.isInspecting = true
    let path = findPath(target)
    views = removeTemp(views)

    if (pathActive(views, path)) {
      views = views.map((v) => {
        if (v.path == path) { v.highlight = true }
        return v
      })
    }
    else {
      views.unshift({ path, highlight: false, temp: true })
    }

    view.update()
  }

  function mouseMove({ target }) {
    lastTarget = target
    if (hudActive) inspect(lastTarget)
  }

  /* todo use escape */
  function closeLast() {
    if (!views.length) return
    removeView(views.length - 1)
  }

  function close(path, e) {
    if (e) e.stopPropagation()

    views = setClosing(views, path)
    view.update()

    on.delay(200, () => {
      views = views.filter(v => path != v.path)
      view.update()
    })
  }

  function findView(path) {
    return views.filter(v => v.path == path)
  }

  function glue(e) {
    const path = findPath(e.target)
    console.log('views are', JSON.stringify(views), 'gluing', path)
    //tempHideHUD()
    // close if no view active
    views = removeTemp(views)
    views = toggleView(views, path)
    view.update()
    /* if (tempActive(views)) { } else { // hideHighlight() // hoverOff() // clickOff() } */
    return false
  }

  function showInspect() {
    inspect(lastTarget)
    hudActive = true
    clickOff = on.click(window, glue)
  }

  function hideInspect() {
    Internal.isInspecting = false
    hudActive = false
    hideHighlight()
    clickOff()
    views = removeTemp(views)
    view.update()
  }

  function onWriteBack(path, data) {
    writeBack(path, data)
    view.update()
  }

  on.keydown(window, isAlt(showInspect))
  on.keyup(window, isAlt(hideInspect))
  on.keyup(window, isEsc(closeLast))

  <views>
    <Inspector.View
      repeat={views}
      key={_.path}
      {..._}
      writeBack={onWriteBack}
      onClose={e => close(_.path, e)}
    />
  </views>

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 2
  }
}
