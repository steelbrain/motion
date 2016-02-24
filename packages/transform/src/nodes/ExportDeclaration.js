import { options } from '../lib/helpers'
import state from '../state'

export default {
  enter(node, parent, scope, file) {
    options.onExports && options.onExports(true)
    state.file.hasExports = true

    if (state.file.hasView)
      throw new Error("Views shouldn't be exported! Put your exports into files without views.")
  },

  exit(node) {
    if (!node.declaration) return

    const declarations = node.declaration.declarations

    if (declarations) {
      const exported = declarations[0].init

      if (state.file.meta.isHot && !exported.isMotionHot) {
        options.onCold && options.onCold(true)
        state.file.meta.isHot = false
      }
    }
  }
}