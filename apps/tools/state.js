const setLocal = (k,v) =>
  localStorage.setItem(`__flint.state.${k}`, JSON.stringify(v))
const getLocal = (k,d) =>
  JSON.parse(localStorage.getItem(`__flint.state.${k}`)) || d

view State {
  let name
  let state = {}
  let props = {}
  let keys = {}
  let show = getLocal('show', false)

  function setView(path) {
    let views = path.split(',')
    name = views[views.length - 1]

    window.Flint.inspect(path, (_name, _props, _state) => {
      name = _name
      props = _props
      state = _state || {}
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

  // toggle
  addEventListener('keydown', e => e.ctrlKey ? keys.ctrl = true : null)
  addEventListener('keyup', e => e.ctrlKey ? keys.ctrl = false : null)
  addEventListener('keydown', e => {
    if (!keys.ctrl) return
    if (e.keyCode === 83) { // S
      show = !show
      setLocal('show', show)
    }
  })

  <state if={show}>
    <controls>
      <button onClick={enterInspect}>Inspect View</button>
    </controls>

    <search class={{ expanded: Object.keys(state).length }}>
      <input type="search" />
    </search>

    <view>
      <name>{name}</name>
      <section>
        <title>Props</title>
        <Tree data={ props } />
      </section>
      <section>
        <title>State</title>
        <Tree data={ state } />
      </section>
    </view>
  </state>

  $state = {
    position: 'fixed',
    top: 0, right: 0, bottom: 0,
    background: '#fff',
    width: '20%',
    minWidth: 250,
    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
    padding: 10,
    pointerEvents: 'auto'
  }

  $name = {
    fontWeight: 500,
    margin: [0, 0, 5]
  }

  $controls = {
    borderBottom: '1px solid #ddd',
    padding: 5,
    margin: -10,
    marginBottom: 0,
    position: 'relative',
    zIndex: 100
  }

  $button = {
    fontWeight: 'bold',
    color: '#f52757',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 4
  }

  $search = {
    transition: 'all ease-in 200ms',
    transform: { y: -100 },
    padding: [10, 0]
  }

  $expanded = {
    transform: { y: 0 }
  }

  $input = {
    borderRadius: 100,
    border: '1px solid #ccc',
    width: '100%',
    padding: [2, 12],
    color: 'rgba(0,0,0,0.5)',
    fontSize: 14,
  }

  $title = {
    fontWeight: 500,
    color: '#ccc',
    textTransform: 'uppercase',
    fontSize: 11,
    margin: [4, 0]
  }

  $section = {
    padding: [0, 0, 10]
  }
}

view Tree {
  <Inspector data={^data} />
}