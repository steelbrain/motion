import state from '../state'

export default () => {
  // export check
  state.hasExports = true

  if (state.hasView)
    throw new Error("Views shouldn't be exported! Put your exports into files without views.")
}