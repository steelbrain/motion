const uncapital = s =>
  s.substr(0, 1).toLowerCase() + s.slice(1)

const reactEvents = `
  onClick onContextMenu onDoubleClick onDrag
  onDragEnd onDragEnter onDragExit onDragLeave
  onDragOver onDragStart onDrop onMouseDown
  onMouseEnter onMouseLeave onMouseMove
  onMouseOut onMouseOver onMouseUp
  onBlur onFocus onKeyDown onKeyUp onChange
  onEnter
`

const events = reactEvents
  .split(' ')
  .map(s => s.trim())
  .filter(s => s != '')
  .map(s => s.substr(2))
  .map(uncapital)

export default events