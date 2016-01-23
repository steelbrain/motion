import md5 from 'md5-o-matic'
import getType from '../lib/getType'
import ellipsize from 'ellipsize'

const PATH_PREFIX = '.root.'
const contains = (string, substring) => string.indexOf(substring) !== -1
const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'

let noop = () => {}

view Leaf {
  prop isExpanded, data, prefix, query, label, id, editable
  prop getOriginal = noop, onSet = noop, onClick = noop

  view.pause()

  let rootPath, path, _data, type, key, original, expanded
  let dataKeys = []
  let _query = ''

  const isInitiallyExpanded = () =>
    view.props.root ||
    !_query && isExpanded(path, data) ||
    !contains(path, _query) && (typeof getOriginal === 'function')

  const transformData = (data = {}) => {
    data = Object.keys(_data).sort()
  }

  on.props(() => {
    rootPath = `${prefix}.${label}`
    key = label.toString()
    path = rootPath.substr(PATH_PREFIX.length)
    // originally was stream of ||s, but 0 was turning into false
    _data = data

    // multiline strings
    if (typeof _data === 'string' && _data.indexOf('\n') > -1) {
      _data = _data.split('\n')
    }

    if (_data)
      dataKeys = Object.keys(_data).sort()

    if (_data === undefined) _data = data
    if (_data === undefined) _data = {}
    type = getType(_data)
    _query = query || ''

    if (view.props.root)
      expanded = true
    else if (_query)
      expanded = !contains(label, _query)

    if (query && !_query)
      expanded = isInitiallyExpanded()

    view.update()
  })

  function toggle(e) {
    if (!view.props.root)
      expanded = !expanded

    view.update()
    onClick(_data)
    e.stopPropagation()
  }

  const getLeafKey = (key, value) => isPrimitive(value) ?
    (key + ':' + md5(String(key))) :
    (key + '[' + getType(value) + ']')

  const format = key => (
    <Highlighter string={key} highlight={_query} />
  )

  const fnParams = fn => fn.toString()
    .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
    .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
    .split(/,/)

  const getLabel = (type, val, sets, editable) => (
    <Label
      val={val}
      editable={editable}
      onSet={_ => onSet([sets, _])}
    />
  )

  <leaf class={rootPath}>
    <label if={!view.props.root} htmlFor={id} onClick={toggle}>
      <key>
        <name>{format(key)}</name>
        {getLabel('key', key, key, false)}
      </key>
      <colon>:</colon>
      <expand class="function" if={type == 'Function'}>
        <i>fn ({fnParams(_data).join(', ')})</i>
      </expand>

      <expand if={type == 'Array'}>
        <type>Array[{_data.length}]</type>
      </expand>
      <expand if={type == 'Object'}>
        <type>{'{}   ' + dataKeys.length + ' keys'}</type>
      </expand>
      <value if={['Array', 'Object', 'Function'].indexOf(type) == -1} class={type.toLowerCase()}>
        <str if={type.toLowerCase() == 'string'}>
          {format(ellipsize(String(_data), 25))}
        </str>
        <else if={type.toLowerCase() != 'string'}>
          {format(String(_data))}
        </else>
        {getLabel('val', _data, key, editable)}
      </value>
    </label>
    <children>
      <child
        if={expanded && !isPrimitive(_data)}
        repeat={dataKeys}>
        <Leaf
          if={_.indexOf('__') == -1}
          key={getLeafKey(_, _data[_])}
          onSet={(...args) => onSet(key, ...args)}
          data={_data[_]}
          editable={editable}
          label={_}
          prefix={rootPath}
          onClick={onClick}
          id={id}
          query={_query}
          getOriginal={original ? null : getOriginal}
          isExpanded={isExpanded}
        />
      </child>
    </children>
  </leaf>

  $leaf = {
    padding: [1, 0],
    fontSize: 13
  }

  const row = {
    flexFlow: 'row'
  }

  $label = [row, {
    position: 'relative',
    color: 'rgba(0,0,0,0.8)',
    opacity: 1,
    alignItems: 'baseline'
  }]

  $helper = { color: '#ffff05' }
  $boolean = { color: '#32a3cd', fontWeight: 700 }
  $number = { color: '#b92222', marginTop: 2, fontWeight: 500 }
  $string = { color: '#698c17' }

  $key = [row, {
    color: 'rgba(0,0,0,0.9)',
    margin: [0],
    fontWeight: 'bold'
  }]

  $function = { marginLeft: 10, marginTop: 2, color: '#962eba' }

  $colon = {
    opacity: 0.3,
    color: '#000'
  }

  $name = {
    color: "#ff2f2f",
    fontWeight: 400,
    margin: ['auto', 0]
  }

  $expand = [row, {
  }]

  $value = [row, {
    position: 'relative',
    margin: [0, 4, 0]
  }]

  $children = {
    paddingLeft: 10
  }

  $type = {
    margin: [1, 0, 0, 8],
    opacity: 0.7,
    flexFlow: 'row',
  }
}
