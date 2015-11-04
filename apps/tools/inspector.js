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

  function enterInspect() {
    const listener = e => {
      // TODO: not working (react synth events)
      e.preventDefault()
      e.stopPropagation()

      let found = findFlintView(e.target)

      if (found)
        setView(found)

      removeEventListener('click', listener, false)
    }
    // settimeout so it doesnt fire right away
    setTimeout(() => {
      addEventListener('click', listener, false)
    })
  }

  function toggle() {
    show = !show
    setLocal('show', show)
    view.update()
  }

  // toggle
  on(window, 'keydown', e => e.ctrlKey ? keys.ctrl = true : null)
  on(window, 'keyup', e => e.ctrlKey ? keys.ctrl = false : null)
  on(window, 'keydown', e => {
    if (!keys.ctrl) return
    if (e.keyCode === 83) { // S
      toggle()
    }
  })

  <state if={show}>
    <view>
      <Close onClick={toggle} size={35} />
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
    width: '20%',
    minWidth: 250,
    padding: 10
  }

  $view = {
    pointerEvents: 'auto',
    padding: 5,
    color: '#fff',
    background: 'linear-gradient(rgba(50,50,50,0.95), rgba(0,0,0,0.9))',
    boxShadow: '0 0 15px rgba(0,0,0,0.2), inset 0 20px 60px rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: 12,
    borderRadius: 5
  }

  $name = {
    fontWeight: 500,
    margin: [0, 0, 5]
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
    fontWeight: 500,
    color: '#fff',
    textTransform: 'uppercase',
    fontSize: 11,
    margin: [0, 0, 4]
  }

  $section = {
    padding: [0, 0, 10]
  }
}