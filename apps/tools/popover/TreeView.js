const type = val => Array.isArray(val) ? 'array' : typeof val
const isObject = obj => typeof obj === 'object' && !Array.isArray(obj) && obj !== null

view TreeView {
  let closed = false

  const showTree = name =>
    (^value[name] !== null && isObject(^value[name].value))

  <Label
    type={type(^value)}
    nested={isObject(^value)}
    closed={closed}
    onClick={() => closed = !closed}>
    {^nodeLabel}
  </Label>
  <children
    if={!closed}
    repeat={Object.keys(^value)}>
      <TreeView
        if={showTree(_.name)}
        nodeLabel={name}
        value={^value[name]}  />
      <Edit
        if={!showTree(_.name)}
        variable={{ name, value: ^value[name] }} />
  </children>

  $ = {
    overflowY: 'hidden',
    margin: closed && '0 0 10px 0'
  }

  $children = {
    background: 'rgba(0,0,0,0.03)',
    padding: '2px 0',
    maxHeight: 400,
    overflow: 'scroll',
  }
}
