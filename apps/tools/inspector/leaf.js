import md5omatic from 'md5-o-matic'

const PATH_PREFIX = '.root.'

view Leaf {
  let root = false
  let prefix = ''
  let expanded = isInitiallyExpanded()

  const path = this.keypath()
  const key = ^label.toString()
  const value = ^data
  const rootPath = () =>  `${^prefix}.${^label}`
  const keypath = () => rootPath().substr(PATH_PREFIX.length)
  const items = count => count + (count === 1 ? ' item' : ' items')
  const toggle = () => expanded = !expanded
  const contains = (string, substring) => string.indexOf(substring) !== -1
  const format = string => highlighter({ string, highlight: ^query })
  const stopProp = cb => e => e.stopPropagation() && cb()
  const onShowOriginalClick = stopProp(() => original = ^getOriginal(keypath()))
  const showButton = () => isPrimitive(^data) || original || !^getOriginal || !^query || contains(this.keypath(), ^query)
  const data = () => original || ^data

  const getLeafKey = (key, value) => isPrimitive(value) ?
    (key + ':' + md5omatic(String(value))) :
    (key + '[' + type(value) + ']')

  const isPrimitive = value => {
    const t = type(value);
    return t !== 'Object' && t !== 'Array';
  }

  const onClick = (data, e) =>
    this.toggle()
    ^onClick(data)
    e.stopPropagation()
  }

  on('props', () => {
    if (^query)
      expanded = !contains(^label, ^query)

    // Restore original expansion state when switching from search mode
    if (^query && !^query) {
      expanded = isInitiallyExpanded()
  })

  function isInitiallyExpanded(p) {
    const keypath = keypath()
    if (^root) return true
    if (^query === '') return ^isExpanded(keypath, ^data)
    else return !contains(keypath, ^query) && (typeof ^getOriginal === 'function')
  }

  function title() {
    let data = data()
    let t = type(data)

    switch (t) {
    case 'Array':
      return <value class="helper">[] ${items(data.length))}</value>
    case 'Object':
      return <value class="helper">{} ${items(Object.keys(data).length))}</value>
    default:
      return <value class={t.toLowerCase()}>{format(String(data))} {interactiveLabel(data, false)}</value>
    }
  }

  function button() {
    var p = this.props;

    if () {
        return null;
    }

    return D.span({
        className: 'json-inspector__show-original',
        onClick: this._onShowOriginalClick
    });
  }

  function label() {
    if (typeof ^interactiveLabel === 'function') {
        return ^interactiveLabel({
            // The distinction between `value` and `originalValue` is
            // provided to have backwards compatibility.
            value: String(originalValue),
            originalValue: originalValue,
            isKey: isKey,
            keypath: this.keypath()
        });
    }

    return null;
  }

  <leaf>
    <input />
    <label>
      <path>{path()}</path>
      <key>{format(key)}: {label(key, true)}</key>
      {title()}
      {button()}
      <key>{format(key)}</key>
    </label>
    <Leaf
      if={expanded && !isPrimitive(data)}
      repeat={Object.keys(data)}
      data={data()[key]}
      label={_}
      prefix={rootPath()}
      onClick={^onClick}
      id={^id}
      query={^query}
      getOriginal={original ? null : ^getOriginal}
      key={getLeafKey(_, data()[key])}
      isExpanded={^isExpanded}
      interactiveLabel={^interactiveLabel}
    / >
  </leaf>
}