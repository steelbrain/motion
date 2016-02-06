import state from '../state'

export default (node, parent, scope, file) => {
  console.log('shit')
  file.metadata.exports.exported.push('one')
  // file.metadata.exports.hasExports = true

  if (state.hasView)
    throw new Error("Views shouldn't be exported! Put your exports into files without views.")
}