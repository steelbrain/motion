const setLocal = (k,v) =>
  localStorage.setItem(`__flint.state.${k}`, JSON.stringify(v))
const getLocal = (k,d) =>
  JSON.parse(localStorage.getItem(`__flint.state.${k}`)) || d

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

view Inspector {
  view.pause()

  let hudActive = false
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

  function inspect(target) {
    _Flint.isInspecting = true
    let path = findPath(target)
    removeTemp()
    if (pathActive(path)) {
      views = views.map((v) => {
        if (v.path == path) { v.highlight = true }
        return v
      })
    } else {
      views.unshift({ path, highlight: false, temp: true })
    }
    view.update()
  }

  function mouseMove({ target }) {
    lastTarget = target

    if (hudActive) {
      inspect(lastTarget)
    }
  }

  function removeTemp() {
    views = views
      .filter(v => !v.temp)
      .map(v => ({ ...v, highlight: false }))
  }
  
  function pathActive(path) {
    return views.filter(v => v.path == path).length > 0
  }

  function tempActive() {
    return views.filter(v => !v.temp).length > 0
  }

  /* todo use escape */
  function closeLast() {
    if (!views.length) return
    removeView(views.length - 1)
  }

  function close(path, e) {
    if (e) e.stopPropagation()
    
    views = views
      .map(v => {
        if (v.path == path) { v.closing = true }
        return v
      })
    view.update()
      
    on.delay(200, () => {
      views = views.filter(v => path != v.path)
      view.update()
    })
    
  }

  // function tempHideHUD() {
  //   hideInspect()
  //   const offAgain = on.mousemove(() => {
  //     offAgain()
  //     if (hudActive) showInspect()
  //   })
  // }

  function findView(path) {
    return views.filter(v => v.path == path)
  }

  function toggleView(path) {
    if (pathActive(path)) {
      views = views.map(v => {
        if (v.path == path) v.temp = true
        return v
      })
    } else {
      views = views
        .concat([{ temp: false, highlight: false, closing: false, path }])
    }
    view.update()
  }

  function glue(e) {
    const path = findPath(e.target)
    console.log('views are', JSON.stringify(views), 'gluing', path)

    //tempHideHUD()

    // close if no view active
    removeTemp()
    toggleView(path)
    /*
    if (tempActive()) {
    }
    else {
      // hideHighlight()
      // hoverOff()
      // clickOff()
    }
    */
    return false
  }

  const hover = () => {
    hoverOff = on.mousemove(window, mouseMove)
  }

  // follow hover always
  hover()

  function showInspect() {
    inspect(lastTarget)
    hudActive = true
    clickOff = on.click(window, glue)
  }

  function hideInspect() {
    console.log('views hide() are', views)
    _Flint.isInspecting = false
    hudActive = false
    hideHighlight()
    clickOff()
    removeTemp()
    view.update()
    console.log('views hide() after are', views)
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

  const isAlt = cb => e => e.keyIdentifier === 'Alt' && cb()
  const isEsc = cb => e => e.keyCode === 27 && cb()

  on.keydown(window, isAlt(showInspect))
  on.keyup(window, isAlt(hideInspect))
  on.keyup(window, isEsc(closeLast))

  <views>
    <Inspector.View
      repeat={views}
      key={_.path}
      {..._}
      writeBack={writeBack}
      onClose={e => close(_.path, e)}
    />
  </views>

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 2
  }
}