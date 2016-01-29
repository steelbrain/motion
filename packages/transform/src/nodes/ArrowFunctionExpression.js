import { stateTrack } from '../lib/wrapState'

export default {
  exit(node) {
    // console.log(node)
    return stateTrack(node)
  }
}