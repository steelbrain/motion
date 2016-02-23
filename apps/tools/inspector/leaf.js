import md5 from 'md5-o-matic'
import getType from '../lib/getType'
import ellipsize from 'ellipsize'

import { isString, isFunction, isBoolean,
         isArray, isNumber, isObject } from 'lodash'

const PATH_PREFIX = '.root.'
const noop = () => {}
const contains = (string, substring) => string.indexOf(substring) !== -1
const isPrimitive = v => getType(v) !== 'Object' && getType(v) !== 'Array'
const getLeafKey = (key, val) => isPrimitive(val) ?
  (key + ':' + md5(String(key))) :
  (key + '[' + getType(val) + ']')

const fnParams = fn => fn.toString()
  .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
  .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
  .split(/,/)

const valueStyles = {
  boolean: { color: '#32a3cd', fontWeight: 700 },
  number: { color: '#b92222', marginTop: 2, fontWeight: 500 },
  string: { color: '#698c17' },
  function: { marginLeft: 10, marginTop: 2, color: '#962eba' },
}

view Leaf {
  view.pause()

  prop root, isExpanded, data, prefix, query, label, id, editable
  prop getOriginal = noop
  prop onSet = noop
  prop onClick = noop

  // state
  let rootPath, path, value, key, original, expanded
  let dataKeys = []
  let _query = ''

  // helpers
  const isInitiallyExpanded = () => root || !_query && isExpanded(path, data) || !contains(path, _query)

  // lifecycle
  on.props(() => {
    rootPath = `${prefix}.${label}`
    key = label.toString()
    path = rootPath.substr(PATH_PREFIX.length)
    value = data // originally was stream of ||s, but 0 was turning into false

    // multiline strings
    if (typeof value === 'string' && value.indexOf('\n') > -1) {
      value = value.split('\n')
    }

    if (value)
      dataKeys = Object.keys(value).sort()

    if (value === undefined) value = data
    if (value === undefined) value = {}
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
    onClick(value)
    e.stopPropagation()
  }

  const getLabel = (type, val, sets, editable) => (
    <Label {...{val, editable, onSet}} />
  )

  let is = {}, type;

  on.change(() => {
    /* don't need to analyze types for root */
    if (view.props.root) return
    is.function = isFunction(value)
    is.array = isArray(value)
    is.object = isObject(value) && !is.array && !is.function
    is.boolean = isBoolean(value)
    is.string = isString(value)
    is.number = isNumber(value)
    is.nested = is.function || is.object || is.array
    is.literal = !is.nested
    type = typeof value
  })

  <leaf class={rootPath}>
    <label if={!view.props.root && key != 'relay' && key != 3} htmlFor={id} onClick={toggle}>
      <key>
        <name>{key}</name>
      </key>
      <colon>:</colon>
      <value>
        <fn style={valueStyles.function} if={is.function}>
          <i>fn ({fnParams(value).join(', ')})</i>
        </fn>
        <array if={is.array}>
          <type>Array[{value.length}]</type>
        </array>
        <obj if={is.object}>
          <type>{'{} '}</type>
        </obj>
        <str if={is.string}>
          <Label val={value}
                 valueStyle={valueStyles.string}
                 editable={true}
                 onSet={value => onSet(key, value)} />
        </str>
        <simple if={is.number || is.boolean}>
          <Label val={value}
                 valueStyle={valueStyles.number}
                 editable={true}
                 onSet={value => onSet(key, value)} />
        </simple>
      </value>
    </label>
    <children>
      <child
        if={expanded && !isPrimitive(value)}
        repeat={dataKeys}>
        <Leaf
          if={_.indexOf('__') == -1}
          key={getLeafKey(_, value[_])}
          onSet={onSet}
          data={value[_]}
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


  $key = [row, {
    color: 'rgba(0,0,0,0.9)',
    margin: [0],
    fontWeight: 'bold'
  }]

  $colon = {
    color: 'rgba(0,0,0,0.2)'
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
    margin: [1, 0, 0, 3],
    opacity: 0.7,
    flexFlow: 'row',
  }
}
