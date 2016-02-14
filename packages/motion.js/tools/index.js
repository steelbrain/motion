import errors from './errors'
import messages from './messages'
import ee from 'event-emitter'

const emitter = ee({})

window._DT = {
  emitter,
  data: null, // should be error
  on(name, cb) { emitter.on(name, cb) },

  timer: {
    // received info through script:add so we can time
    lastMsgInfo: null,

    //maps views to original time
    timing: {},
    lastTimes: {},
    hasLogged: false,
    done(view) {
      const timing = Motion.timer.timing[view]

      const time = +(Date.now()) - timing.start
      if (!time) return

      if (timing) {
        Motion.timer.lastTimes[view] = time
        delete Motion.timer.timing[view]
      }
      if (!Motion.timer.hasLogged) {
        setTimeout(() => Motion.timer.hasLogged = false)
        Motion.timer.lastTimes[view] = +(Date.now()) - timing.start
        on.event('hot:finished', { time })
      }
      Motion.timer.hasLogged = true
    },
    time(view, info) {
      Motion.timer.timing[view] = info
    },
  },
}

const opts = {
  websocketPort: window._MOTION_WEBSOCKET_PORT
}

errors(window._DT, opts)
messages(window._DT, opts)