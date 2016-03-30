import state from '../state'

export default (node) => {
  state.file.imports.push(node.source.value)
}
