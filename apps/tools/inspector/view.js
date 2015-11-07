function pathToName(path) {
  let p = path.split(',')
  return p[p.length - 1].split('.')[0]
}

view Inspector.View {
  const inspect = window.Flint.inspect
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
    <Close onClick={view.props.onClose} fontSize={30} size={35} />
    <name>{name}</name>
    <section if={props} class="props">
      <title>Props</title>
      <Tree data={props} />
    </section>
    <section if={state}>
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
    padding: 12,
    margin: 10,
    minWidth: 220,
    borderBottom: 'none',
    fontSize: 12,
    borderRadius: 2,
    userSelect: 'none',
    cursor: 'default',
    background: '#4b4b4b',
    boxShadow: '0 0 0 1px rgba(39,39,39,.9)',
    borderRadius: 2,
    color: '#b0b0b0',
    textShadow: '0 -1px rgba(0,0,0,.3)'
  }

  $Close = {
    top: -2,
    right: -2,
  }

  $name = {
    fontWeight: 500,
    margin: [-3, 0, 3],
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
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
    display: 'none',
    color: 'rgba(255,255,255,0.33)',
    fontWeight: 200,
    fontSize: 12,
    margin: [3, 0]
  }

  $section = {
    padding: [0]
  }

  $props = {
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)',
    paddingBottom: 8,
    marginBottom: 8
  }
}