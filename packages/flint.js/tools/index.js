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
      const timing = Flint.timer.timing[view]

      const time = +(Date.now()) - timing.start
      if (!time) return

      if (timing) {
        Flint.timer.lastTimes[view] = time
        delete Flint.timer.timing[view]
      }
      if (!Flint.timer.hasLogged) {
        setTimeout(() => Flint.timer.hasLogged = false)
        Flint.timer.lastTimes[view] = +(Date.now()) - timing.start
        on.event('hot:finished', { time })
      }
      Flint.timer.hasLogged = true
    },
    time(view, info) {
      Flint.timer.timing[view] = info
    },
  },
}

const opts = {
  websocketPort: window._FLINT_WEBSOCKET_PORT
}

errors(window._DT, opts)
messages(window._DT, opts)