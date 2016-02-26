import ReactUpdates from 'react/lib/ReactUpdates'
import raf from 'raf'

const tick = () => {
  ReactUpdates.flushBatchedUpdates()
  raf(tick)
}

const inject = () => {
  ReactUpdates.injection.injectBatchingStrategy({
    isBatchingUpdates: true,
    batchedUpdates: function(callback, ...args) {
      callback(...args)
    }
  })
  raf(tick)
}

export default { inject }