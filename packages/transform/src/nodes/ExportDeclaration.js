import state from '../state'

export default () => {
  if (state.hasView)
    throw new Error("Views shouldn't be exported! Put your exports into files without views.")
}