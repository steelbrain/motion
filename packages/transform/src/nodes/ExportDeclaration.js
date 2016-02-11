import { options } from '../lib/helpers'
import state from '../state'

export default (node, parent, scope, file) => {
  options.onExports && options.onExports(true)
  state.hasExports = true

  if (state.hasView)
    throw new Error("Views shouldn't be exported! Put your exports into files without views.")
}