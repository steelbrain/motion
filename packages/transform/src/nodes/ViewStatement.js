import state, { resetViewState } from '../state'
import { t, normalizeLocation } from '../lib/helpers'

export default {
  enter(node, parent, scope, file) {
    const name = node.name.name
    const subName = node.subName && node.subName.name
    const fullName = name + (subName ? `.${subName}` : '')

    // start new view
    resetViewState()
    state.currentView = fullName
    state.inView = fullName
    state.file.meta.views[fullName] = {
      location: normalizeLocation(node.loc),
      file: file.opts.filename,
      styles: {},
      els: {}
    }

    node.block.motionView = true

    return t.callExpression(t.identifier('Motion.view'), [t.literal(fullName),
      t.functionExpression(null, [t.identifier('view'), t.identifier('on'), t.identifier('$')], node.block)]
    )
  }
}