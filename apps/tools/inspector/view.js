import clone from 'clone'

function pathToName(path) {
  let p = path.split(',')
  return p[p.length - 1].split('.')[0]
}

function filterProps(props) {
  ['if', 'repeat', 'style', '__key', '__tagName', '_flintOnMount'].map(name => { delete props[name] })
  return props
}

view Inspector.View {
  const inspect = window.Flint.inspect
  let name, path
  let state = {}
  let props = null
  let writeBack = null

  let onSet = (write) => {
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
    userSelect: 'none',
    cursor: 'default',
    background: '#fff',
    boxShadow: '0px 2px 16px rgba(0,0,0,0.1)',
    border: '1px solid #ccc',
    borderRadius: 5,
    color: '#333',
  }

  $Close = {
    top: -5,
    right: -5,
    fontSize: 16
  }

  $name = {
    fontWeight: 400,
    color: 'rgba(0,0,0,0.8)',
    padding: 8,
    fontSize: 14
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
    marginBottom: 2
  }
}