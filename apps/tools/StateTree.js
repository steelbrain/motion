view State.Tree {
  isObject = v => (!!v) && (v.constructor === Object)
  isArray = v => (!!v) && (v.constructor === Array)
  isComplex = v => isObject(v) || isArray(v)

  orange = { fontWeight: 600, color: 'rgba(227, 147, 0, 0.71)' }
  typeStyle = {
    string: {
      color: 'green',
    },
    object: { color: '#75b5aa' },
    boolean: orange,
    number: orange
  }

  toS = v => {
    if (v === null) return "null"
    if (v.toString) return v.toString()
  }

  <closed if={isObject(^value)}
          click={^onToggle}>
    {"{}"} {Object.keys(^value).length} items
  </closed>
  <closed if={isArray(^value)}
          click={^onToggle}>
    {"[]"} {^value.length} items
  </closed>
  <value if={!isComplex(^value)}
         style={typeStyle[typeof(^value)]}>
    {toS(^value)}
  </value>

  $closed = {
    flexFlow: 'row',
    color: '#b0b0b0',
    font: "1em/1 Consolas, monospace",
  }
}

view State.TreeDetail {
  <Var repeat={Object.keys(^value)}
       name={_} value={^value[_]} />
}
