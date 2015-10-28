const PATH_PREFIX = '.root.'

const contains = (string, substring) => string.indexOf(substring) !== -1
const items = count => count + (count === 1 ? ' item' : ' items')
const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'

view Leaf {
  let rootPath, path, data, type, key, original, expanded
  let prefix = ''
  let query = ''

  const isInitiallyExpanded = () =>
    ^root ||
    !query && ^isExpanded(path, data) ||
    !contains(path, query) && (typeof ^getOriginal === 'function')

  on('props', () => {
    rootPath = `${^prefix}.${^label}`
    key = ^label.toString()
    path = rootPath.substr(PATH_PREFIX.length)
    data = original || ^data || {}
    type = getType(data)
    query = ^query || ''

    if (^root)
      expanded = true
    else if (query)
      expanded = !contains(^label, query)

    if (^query && !query)
      expanded = isInitiallyExpanded()
  })

  function showOriginalClick(e) {
    original = ^getOriginal(path)
    e.stopPropagation()
  }

  function toggle(e) {
    if (!^root)
      expanded = !expanded

    ^onClick && ^onClick(data)
    e.stopPropagation()
  }

  const format =   key => <Highlighter string={key} highlight={query} />

  <leaf class={rootPath}>
    <label htmlFor={^id} onClick={toggle}>
      <key>
        <name>{format(key)}</name>:
        <Label val={key} />
      </key>
      <title>
        <expand if={type == 'Array'}>
          <type>[]</type> {items(data.length)}
        </expand>
        <expand if={type == 'Object'}>
          <type>{'{}'}</type> {items(Object.keys(data).length)}
        </expand>
        <value if={type != 'Array' && type != 'Object'} class={type.toLowerCase()}>
          {format(String(data))}
          <Label val={data} />
        </value>
      </title>
      <button
        if={!(isPrimitive(data) || original || !^getOriginal || !query || contains(path, query))}
        onClick={showOriginalClick}
      />
    </label>
    <children>
      <Leaf
        if={expanded && !isPrimitive(data)}
        repeat={Object.keys(data)}
        data={data[_]}
        label={_}
        prefix={rootPath}
        onClick={^onClick}
        id={^id}
        query={query}
        getOriginal={original ? null : ^getOriginal}
        isExpanded={^isExpanded}
      />
    </children>
  </leaf>

  const row = {
    flexFlow: 'row'
  }

  $label = [row, {
    position: 'relative',

    ':hover': {
      background: '#ffffb6'
    }
  }]

  $helper = $null = { color: '#b0b0b0' }
  $boolean = { color: '#75b5aa' }
  $number = { color: '#d28445' }
  $string = { color: '#798953' }

  $key = [row, {
    color: '#555',
    margin: [0, 2, 0, 0]
  }]

  $name = {
    margin: [0, 2, 0, 0]
  }

  $expand = [row, {
    color: '#999'
  }]

  $value = [row, {
    position: 'relative'
  }]

  $children = {
    paddingLeft: 10
  }

  $type = {
    margin: [0, 5],
    opacity: 0.5
  }
}