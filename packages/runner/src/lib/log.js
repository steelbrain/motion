import opts from '../opts'

let debug = false

export default function log(...args) {
  if (!debug) return

  if (typeof debug == 'string')
    if (typeof args[0] == 'string' && args[0].indexOf(debug) >= 0) {
      args.shift()
      return console.log(...args)
    }
    else return

  console.log(...args)
}

log.setLogging = function() {
  debug = opts.get('debug')
}