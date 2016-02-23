import { t, componentTrack } from '../lib/helpers'

export default {
  exit(node) {
    if (node.superClass && node.superClass.name == 'Component') {
      return [
        node,
        componentTrack(node.id.name)
      ]
    }
  }
}