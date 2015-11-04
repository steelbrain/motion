const setLocal = (k,v) =>
  localStorage.setItem(`__flint.state.${k}`, JSON.stringify(v))

const getLocal = (k,d) =>
  JSON.parse(localStorage.getItem(`__flint.state.${k}`)) || d

view Inspector {
  view.pause()

  let name, path
  let state = {}
  let props = {}
  let writeBack = null

  let keys = {}
  let show = getLocal('show', false)

  function setView(_path) {
    path = _path
    let views = path.split(',')
    name = views[views.length - 1]

    window.Flint.inspect(path, (_name, _props, _state, _wb) => {
      name = _name
      props = _props || {}
      state = _state || {}
      writeBack = _wb
      view.update()
    })
  }

  function findFlintView(node) {
    if (!node || !node.getAttribute) return null
    const flintid = node.__flintID
    if (flintid) return flintid
    else return findFlintView(node.parentNode)
  }

  function inspect(e) {
    // TODO: not working (react synth events)
    e.preventDefault()
    e.stopPropagation()

    let found = findFlintView(e.target)

    if (found)
      setView(found)
  }

  let glued = false

  function glue(e) {
    // off (hoverEvent)
    inspect(e)
    glued = true
  }

  let hoverEvent, clickEvent

  function toggle() {
    show = !show
    setLocal('show', show)

    if (show) {
      hoverEvent = on(window, 'mousemove', inspect)
      clickEvent = on(window, 'click', glue)
    }
    else {
      // off(hoverEvent)
      // off(clickEvent)
    }

    view.update()
  }

  on(window, 'keydown', e => {
    if (e.keyIdentifier === 'Alt') {
      toggle()
    }
  })

  on(window, 'keyup', e => {
    if (e.keyIdentifier === 'Alt') {
      if (!glued)
        toggle()
    }
  })

  function close() {
    glued = false
    toggle()
  }

  // toggle
  // on(window, 'keyup', e => e.ctrlKey ? keys.ctrl = false : null)
  // on(window, 'keydown', e => {
  //   if (e.ctrlKey) keys.ctrl = true
  //   if (!keys.ctrl) return
  //   if (e.keyCode === 83) { // S
  //     toggle()
  //   }
  // })

  <state if={show}>
    <view>
      <Close onClick={close} size={35} />
      <name>{name || 'Untitled'}</name>
      <section>
        <title>Props</title>
        <Tree data={props} />
      </section>
      <section>
        <title>State</title>
        <Tree
          onSet={write => writeBack(path, write)}
          data={state}
        />
      </section>
    </view>
  </state>

  $state = {
    position: 'fixed',
    top: 0, right: 0,
    padding: 8
  }

  $view = {
    position: 'relative',
    pointerEvents: 'auto',
    padding: 8,
    minWidth: 150,
    color: '#fff',
    background: 'linear-gradient(rgba(50,50,50,0.85), rgba(40,40,40,0.9))',
    boxShadow: '0 0 15px rgba(0,0,0,0.2), inset 0 20px 60px rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderBottom: 'none',
    fontSize: 12,
    borderRadius: 4
  }

  $Close = {
    top: -5,
    right: -5
  }

  $name = {
    fontWeight: 500,
    margin: [-2, 0, 0],
    textAlign: 'center'
  }

  $expanded = {
    transform: { y: 0 }
  }

  $input = {
    borderRadius: 100,
    border: '1px solid #ccc',
    width: '100%',
    padding: [2, 12],
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  }

  $title = {
    color: 'rgba(255,255,255,0.33)',
    textShadow: '0 -1px 0 rgba(0,0,0,0.24)',
    fontWeight: 200,
    fontSize: 11,
    margin: [0, 0, 0, -1],
    textTransform: 'lowercase'
  }

  $section = {
    padding: [0]
  }
}