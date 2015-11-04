const inspect = window.Flint.inspect

function pathToName(path) {
  let p = path.split(',')
  return p[p.length - 1].split('.')[0]
}

view Inspector.View {
  let name, path
  let state = {}
  let props = {}
  let writeBack = null

  on.props(() => {
    path = view.props.path
    if (path === 'temp') return

    if (path) {
      name = pathToName(path)

      inspect(path, (_props, _state, _wb) => {
        props = _props || {}
        state = _state || {}
        writeBack = _wb
        view.update()
      })
    }
  })

  <view>
    <Close onClick={view.props.onClose} size={35} />
    <name>{name}</name>
    <section>
      <title>Props</title>
      <Tree data={props} />
    </section>
    <section>
      <title>State</title>
      <Tree
        onSet={write => view.props.writeBack(path, write)}
        data={state}
      />
    </section>
  </view>

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