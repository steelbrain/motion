import md5omatic from 'md5-o-matic'

const PATH_PREFIX = '.root.'

view Leaf {
  let path, data, type, root, key, original, expanded
  let prefix = ''
  let query = ''

  on('props', () => {
    root = ^root

    key = ^label.toString()
    path = keypath()
    data = original || ^data || {}
    type = getType(data)
    query = ^query || ''

    expanded = true
    // if (query)
    //   expanded = !contains(^label, query)
    //
    // if (query && !query)
    //   expanded = isInitiallyExpanded()
  })

  const rootPath = () =>  `${^prefix}.${^label}`
  const keypath = () => rootPath().substr(PATH_PREFIX.length)
  const items = count => count + (count === 1 ? ' item' : ' items')
  const toggle = () => expanded = !expanded
  const contains = (string, substring) => string.indexOf(substring) !== -1
  const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'
  const getLeafKey = (key, value) => isPrimitive(value) ?
    (key + ':' + md5omatic(String(value))) :
    (key + '[' + getType(value) + ']')

  const showOriginalClick = e => {
    original = ^getOriginal(keypath())
    e.stopPropagation()
  }

  const labelClick = e => {
    toggle()
    ^onClick && ^onClick(data)
    e.stopPropagation()
  }

  function isInitiallyExpanded() {
    const p = keypath()
    if (^root) return true
    if (query === '') return ^isExpanded(p, data)
    else return !contains(p, query) && (typeof ^getOriginal === 'function')
  }

  const format = key => <Highlighter string={key} highlight={query} />

  <leaf class={rootPath()}>
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
        if={!(isPrimitive(data) || original || !^getOriginal || !query || contains(keypath(), query))}
        onClick={showOriginalClick}
      />
    </label>
    <children>
      <Leaf
        if={expanded && !isPrimitive(data)}
        repeat={Object.keys(data)}
        data={data[_]}
        label={_}
        prefix={rootPath()}
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