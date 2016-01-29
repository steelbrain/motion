import { stateTrack } from '../lib/wrapState'

export default {
  exit(node) {
    return stateTrack(node)
  }
}