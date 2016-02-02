import md5 from 'md5-o-matic'
import getType from '../lib/getType'
import ellipsize from 'ellipsize'

import { isString, isFunction,
         isArray, isNumber, isObject } from 'lodash'

const PATH_PREFIX = '.root.'
const noop = () => {}
const contains = (string, substring) => string.indexOf(substring) !== -1
const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'
const getLeafKey = (key, value) => isPrimitive(value) ?
  (key + ':' + md5(String(key))) :
  (key + '[' + getType(value) + ']')
const fnParams = fn => fn.toString()
  .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
  .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
  .split(/,/)

const fnParams = fn => fn.toString()
  .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
  .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
  .split(/,/)

view Leaf {
  view.pause()

  prop root, isExpanded, data, prefix, query, label, id, editable
  prop getOriginal = noop
  prop onSet = noop
  prop onClick = noop

  // state
  let rootPath, path, _data, key, original, expanded

  let dataKeys = []
  let _query = ''

  // helpers
  const isInitiallyExpanded = () => root || !_query && isExpanded(path, data) || !contains(path, _query)

  // lifecycle
  on.props(() => {
    rootPath = `${prefix}.${label}`
    key = label.toString()
    path = rootPath.substr(PATH_PREFIX.length)
    _data = data // originally was stream of ||s, but 0 was turning into false

    // multiline strings
    if (typeof _data === 'string' && _data.indexOf('\n') > -1) {
      _data = _data.split('\n')
    }

    if (_data)
      dataKeys = Object.keys(_data).sort()

    if (_data === undefined) _data = data
    if (_data === undefined) _data = {}
    _query = query || ''

    if (view.props.root)
      expanded = true
    else if (_query)
      expanded = !contains(label, _query)

    if (query && !_query)
      expanded = isInitiallyExpanded()

    view.update()
  })

  const toggle = (e) => {
    if (!root) expanded = !expanded
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

  const getLabel = (type, val, sets, editable) => (
    <Label
      val={val}
      editable={editable}
      onSet={_ => onSet([sets, _])}
    />
  )

  let is = {}, type;

  on.change(() => {
    is.function = isFunction(_data)
    is.array = isArray(_data)
    is.object = isObject(_data)
    is.string = isString(_data)
    is.number = isNumber(_data)
    is.nested = is.function || is.object || is.array
    is.literal = !is.nested
    type = typeof _data
  })

  <leaf class={rootPath}>
    <label if={!view.props.root} htmlFor={id} onClick={toggle}>
      <key>
        <name>{format(key)}</name>
      </key>
      <colon>:</colon>
      <value>
        <fn class="function" if={is.function}>
          <i>fn ({fnParams(_data).join(', ')})</i>
        </fn>
        <array if={is.array}>
          <type>Array[{_data.length}]</type>
        </array>
        <obj if={is.object}>
          <type>{'{}   ' + dataKeys.length + ' keys'}</type>
        </obj>
        <nested if={is.nested} class={type.toLowerCase()}>
          <str if={is.string}>
            {format(ellipsize(String(_data), 25))}
          </str>
          <else if={!is.string && is.literal}>
            {format(String(_data))}
          </else>
          {getLabel('val', _data, key, editable)}
        </nested>
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

  $function = {
    marginLeft: 10,
    marginTop: 2,
    color: '#962eba'
  }

  $colon = {
    opacity: 0.3,
    color: '#000'
  }

  $name = {
    color: "#ff2f2f",
    fontWeight: 400,
    margin: ['auto', 0]
  }

  $expand = [row]

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
