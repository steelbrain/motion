import md5 from 'md5-o-matic'
import getType from '../lib/getType'

const PATH_PREFIX = '.root.'

const contains = (string, substring) => string.indexOf(substring) !== -1
const items = count => count + (count === 1 ? ' item' : ' items')
const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'

view Leaf {
  view.pause()

  let rootPath, path, data, type, key, original, expanded
  let prefix = ''
  let query = ''

  const isInitiallyExpanded = () =>
    view.props.root ||
    !query && view.props.isExpanded(path, data) ||
    !contains(path, query) && (typeof view.props.getOriginal === 'function')

  on('props', () => {
    rootPath = `${view.props.prefix}.${view.props.label}`
    key = view.props.label.toString()
    path = rootPath.substr(PATH_PREFIX.length)
    data = original || view.props.data || {}
    type = getType(data)
    query = view.props.query || ''

    if (view.props.root)
      expanded = true
    else if (query)
      expanded = !contains(view.props.label, query)

    if (view.props.query && !query)
      expanded = isInitiallyExpanded()

    view.update()
  })

  function toggle(e) {
    if (!view.props.root)
      expanded = !expanded

    view.update()
    view.props.onClick && view.props.onClick(data)
    e.stopPropagation()
  }

  const getLeafKey = (key, value) => isPrimitive(value) ?
    (key + ':' + md5(String(value))) :
    (key + '[' + getType(value) + ']')

  const format = key => (
    <Highlighter string={key} highlight={query} />
  )

  const label  = (type, val, sets) => (
    <Label
      val={val}
      onSet={_ => view.props.onSet([sets, _])}
    />
  )

  <leaf class={rootPath}>
    <label if={!view.props.root} htmlFor={view.props.id} onClick={toggle}>
      <key>
        <name>{format(key)}</name>
        {label('key', key, key)}
      </key>
      <expand if={type == 'Array'}>
        <type>[]</type> {items(data.length)}
      </expand>
      <expand if={type == 'Object'}>
        <type>{'{}'}</type> {items(Object.keys(data).length)}
      </expand>
      <value if={type != 'Array' && type != 'Object'} class={type.toLowerCase()}>
        {format(String(data))}
        {label('val', data, key)}
      </value>
    </label>
    <children>
      <child
        if={expanded && !isPrimitive(data)}
        repeat={Object.keys(data)}>
        <Leaf
          if={_.indexOf('__') == -1}
          key={getLeafKey(_, data[_])}
          onSet={(...args) => view.props.onSet(key, ...args)}
          data={data[_]}
          label={_}
          prefix={rootPath}
          onClick={view.props.onClick}
          id={view.props.id}
          query={query}
          getOriginal={original ? null : view.props.getOriginal}
          isExpanded={view.props.isExpanded}
        />
      </child>
    </children>
  </leaf>

  $leaf = {
    padding: [1, 0]
  }

  const row = {
    flexFlow: 'row'
  }

  $label = [row, {
    position: 'relative',
    color: 'rgba(255,255,255,0.6)',
    opacity: 1,

    ':hover': {
      background: 'rgba(255,255,255,0.1)'
    }
  }]

  $helper = $null = { color: '#ffff05' }
  $boolean = { color: '#06ffd4', fontWeight: 700 }
  $number = { color: '#f17817' }
  $string = { color: '#b3ff00' }

  $key = [row, {
    color: 'rgba(255,255,255,0.9)',
    margin: [0],
    fontWeight: 'bold'
  }]

  $name = {
    color: "#fff",
    margin: [0]
  }

  $expand = [row, {
  }]

  $value = [row, {
    position: 'relative',
    margin: [0, 4]
  }]

  $children = {
    paddingLeft: 10
  }

  $type = {
    margin: [0, 0, 0, 5],
    opacity: 0.4
  }
}