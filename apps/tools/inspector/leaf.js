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
  const stopProp = cb => e => e.stopPropagation() && cb()
  const showOriginalClick = stopProp(() => original = ^getOriginal(keypath()))
  const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'
  const getLeafKey = (key, value) => isPrimitive(value) ?
    (key + ':' + md5omatic(String(value))) :
    (key + '[' + getType(value) + ']')

  const labelClick = (data, e) => {
    toggle()
    ^onClick(data)
    e.stopPropagation()
  }

  function isInitiallyExpanded() {
    const p = keypath()
    if (^root) return true
    if (query === '') return ^isExpanded(p, ^data)
    else return !contains(p, query) && (typeof ^getOriginal === 'function')
  }

  const format = string => <Highlighter string={string} highlight={query} />
  const interactiveLabel = (oVal, isKey) => (
    <label
      value={String(oVal)}
      originalValue={oVal}
      isKey={isKey}
      keypath={keypath()}
    />
  )

  <input type="radio" name={^id} tabIndex={-1} />
  <label htmlFor={^id} onClick={labelClick}>
    <path>{rootPath()}</path>
    <key>
      {format(key)}:
      {interactiveLabel(key, true)}
    </key>
    <value if={type == 'Array'}>
      [] ${items(data.length)}
    </value>
    <value if={type == 'Object'}>
      {} ${items(Object.keys(data).length)}
    </value>
    <value if={type != 'Array' && type != 'Object'} class={type.toLowerCase()}>
      {format(String(data))} {interactiveLabel(data, false)}
    </value>
    <button
      if={isPrimitive(data) || original || !^getOriginal || !query || contains(keypath(), query)}
      onClick={showOriginalClick}
    />
    <key>{format(key)}</key>
  </label>
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
    interactiveLabel={^interactiveLabel}
  />

  const row = {
    flexFlow: 'row'
  }

  $label = row
  $key = row
  $value = row
}