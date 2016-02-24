import { t, componentTrack } from '../lib/helpers'

export default {
  exit(node, parent, scope) {
    if (node.superClass && node.superClass.name == 'Component') {
      const name = node.id.name
      scope.rename(name)
      const uid = node.id.name

      return [
        node,
        componentTrack(name, uid)
      ]
    }
  }
}