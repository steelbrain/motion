import state from '../state'

export default (node, parent, scope, file) => {
  const importPath = node.source.value
  state.fileImports.push(importPath)
}