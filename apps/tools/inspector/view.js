import clone from 'clone'

function pathToName(path) {
  let p = path.split(',')
  return p[p.length - 1].split('.')[0]
}

let filterProps = props => {
  ['if', 'repeat', 'style', '__key', '__tagName'].map(name => { delete props[name] })
  console.log('props are', props)
  return props
}

view Inspector.View {
  const inspect = window.Flint.inspect
  let name, path
  let state = {}
  let props = null
  let writeBack = null

  let onSet = (write) => {
    console.log('writing', path, write)
    view.props.writeBack(path, write)
  }

  on.props(() => {
    path = view.props.path
    if (path === 'temp') return

    if (path) {
      name = pathToName(path)

      inspect(path, (_props, _state, _wb) => {
        props = filterProps(clone(_props || {}))
        state = _state || {}
        writeBack = _wb
        view.update()
      })
    }
  })

  let hasKeys = o => o && Object.keys(o).length > 0

  <view>
    <Close onClick={view.props.onClose} fontSize={20} size={35} />
    <name>{name}</name>
    <Inspector.Section title="Props" if={hasKeys(props)} class="props">
      <Tree editable={false} data={props} />
    </Inspector.Section>
    <Inspector.Section title="State" if={hasKeys(state)}>
      <Tree
        editable={true}
        onSet={onSet}
        data={state}
      />
    </Inspector.Section>
  </view>

  $view = {
    position: 'relative',
    pointerEvents: 'auto',
    margin: 10,
    minWidth: 220,
    fontSize: 12,
    borderRadius: 2,
    userSelect: 'none',
    cursor: 'default',
    background: '#fff',
    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    borderRadius: 4,
    color: '#333',
  }

  $Close = {
    top: -5,
    right: 0,
  }

  $name = {
    fontWeight: 500,
    color: 'rgba(0,0,0,0.8)',
  }

  $expanded = {
    transform: { y: 0 }
  }

  $input = {
    borderRadius: 100,
    border: '1px solid #ccc',
    width: '100%',
    padding: [2, 12],
    color: '#333',
    fontSize: 14,
  }

  $title = {
    display: 'none',
    color: '#333',
    fontWeight: 200,
    fontSize: 12,
    margin: [3, 0]
  }

  $props = {
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)',
    paddingBottom: 8,
    marginBottom: 8
  }
}