import JSONTree from 'react-json-tree'

view State {
  let inspecting, name
  let state = {}
  let keys = {}
  let show = false

  function setView(path) {
    let views = path.split(',')
    name = views[views.length - 1]
    state = window.Flint.getCache[path]
    inspecting = true
  }

  function findFlintView(node) {
    if (!node || !node.getAttribute) return null
    const flintid = node.getAttribute('data-flintid')
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
    if (e.keyCode === 83) // S
      show = !show
  })

  <state if={show} class="block">
    <controls>
      <button onClick={enterInspect}>Inspect View</button>
    </controls>
    <view>
      <title>Home</title>
      <props>
        <Tree data={ state } />
      </props>
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

  $controls = {
    borderBottom: '1px solid #ddd',
    padding: 5,
    margin: -10,
    marginBottom: 10
  }

  $button = {
    fontWeight: 'bold',
    color: '#f52757',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 4
  }
}

view Tree {
  <JSONTree
    getListStyle={listStyle}
    getLabelStyle={labelStyle}
    getValueStyle={valueStyle}
    yield
  />

  const listStyle = (type, expanded) => ({
    marginLeft: 0
  })

  const labelStyle = (type, expanded) => ({
    margin: 0
  })

  const valueStyle = (type, expanded) => ({
    margin: 0
  })
}