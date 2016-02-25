import inspecting from './lib/inspecting'
import { keys, onKey, onKeyDown } from './keys'
import { throttle } from 'lodash'

const removeHead = ([l, ...ls]) => ls
const setLocal = (k,v) => localStorage.setItem(`__motion.state.${k}`, JSON.stringify(v))
const getLocal = (k,d) => JSON.parse(localStorage.getItem(`__motion.state.${k}`)) || d

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
  const motionid = node.__motionID
  if (!motionid) return findPath(node.parentNode)
  positionHighlight(node)
  return motionid
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

function addTemp(views, path) {
  return [{ path, highlight: false, temp: true }].concat(views)
}

function setClosing(views, path) {
  return views.map(v => {
    if (v.path == path) v.closing = true
    return v
  })
}

function highlightPath(views, path) {
  return views.map((v) => {
    if (v.path == path) v.highlight = true
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
    let added = { temp: false, highlight: false, closing: false, path }
    return [].concat([added], views)
  }
}

function internal() {
  return window._Motion
}

view Inspector {
  let clickOff, hoverOff, lastTarget
  let hudActive = false
  let views = []

  on.mount(() => {
    hoverOff = on.mousemove(window, throttle(mouseMove, 40))
    if (highlighter) return
    highlighter = document.createElement('div')
    highlighter.className = "_motionHighlighter"
    document.body.appendChild(highlighter)
  })

  on.event('hud:show', showInspect)
  on.event('hud:hide', hideInspect)

  // key events
  onKeyDown('esc', closeLast)

  function inspect(target) {
    internal().isInspecting = true
    let path = findPath(target)
    if (path === null) return
    views = removeTemp(views)
    views = pathActive(views, path) ?
      highlightPath(views, path) :
      addTemp(views, path)
  }

  function mouseMove({ target }) {
    const inspector = ReactDOM.findDOMNode(view)

    if (lastTarget != target) {
      if (inspector.contains(target) || document.querySelector('.__motionMenu').contains(target))
        return

      lastTarget = target
      inspecting.set(target)
      if (hudActive)
        inspect(lastTarget)
    }
  }

  function closeLast() {
    if (!views.length) return
    views = removeHead(views)
  }

  function close(path, e) {
    if (e) e.stopPropagation()
    views = setClosing(views, path)

    on.delay(200, () => {
      views = views.filter(v => path != v.path)
    })
  }

  function glue({ target }) {
    if (!hudActive) return
    const inspector = ReactDOM.findDOMNode(view)
    if (inspector.contains(target)) return

    views = toggleView(removeTemp(views), findPath(target))
    return false
  }

  function showInspect() {
    inspect(lastTarget)
    hudActive = true
    clickOff = on.click(window, glue)
  }

  function hideInspect() {
    internal().isInspecting = false
    hudActive = false
    hideHighlight()
    clickOff && clickOff()
    views = removeTemp(views)
  }

  <Inspector.View
    repeat={views}
    key={_.path}
    {..._}
    onClose={e => close(_.path, e)}
  />

  $ = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 2
  }
}
