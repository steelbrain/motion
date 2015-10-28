import md5omatic from 'md5-o-matic'

const PATH_PREFIX = '.root.'
const contains = (string, substring) => string.indexOf(substring) !== -1

view Leaf {
  let rootPath, path, data, type, root, key, original, expanded
  let prefix = ''
  let query = ''

  on('props', () => {
    rootPath = `${^prefix}.${^label}`
    root = ^root
    key = ^label.toString()
    path = rootPath.substr(PATH_PREFIX.length)
    data = original || ^data || {}
    type = getType(data)
    query = ^query || ''

    if (query)
      expanded = !contains(^label, query)
    if (^query && !query)
      expanded = isInitiallyExpanded()
  })

  function showOriginalClick (e) {
    original = ^getOriginal(path)
    e.stopPropagation()
  }

  function labelClick(e) {
    toggle()
    ^onClick && ^onClick(data)
    e.stopPropagation()
  }

  function isInitiallyExpanded() {
    if (^root) return true
    if (query === '') return ^isExpanded(path, data)
    else return !contains(path, query) && (typeof ^getOriginal === 'function')
  }

  const items = count => count + (count === 1 ? ' item' : ' items')
  const toggle = () => expanded = !expanded
  const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'
  const getLeafKey = (key, value) => isPrimitive(value) ?
    (key + ':' + md5omatic(String(value))) :
    (key + '[' + getType(value) + ']')

  const format = key => <Highlighter string={key} highlight={query} />

  <leaf class={rootPath}>
    <label htmlFor={^id} onClick={labelClick}>
      <key>
        {format(key)}:
        <Label val={key} />
      </key>
      <title>
        <value if={type == 'Array'}>
          [] ${items(data.length)}
        </value>
        <value if={type == 'Object'}>
          {} ${items(Object.keys(data).length)}
        </value>
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
        key={getLeafKey(_, data[_])}
        isExpanded={^isExpanded}
      />
    </children>
  </leaf>

  const row = {
    flexFlow: 'row'
  }

  $label = [row, {
    position: 'relative'
  }]

  $helper = $null = { color: '#b0b0b0' }
  $boolean = { color: '#75b5aa' }
  $number = { color: '#d28445' }
  $string = { color: '#798953' }

  $key = [row, {
    color: '#555'
  }]

  $value = [row, {
    position: 'relative'
  }]

  $children = {
    paddingLeft: 10
  }
}