import opts from '../opts'

const seed = (s) => {
  s = Math.sin(s) * 10000;
  return s - Math.floor(s)
}

const color = ident => {
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
  const num = +ident.split().map(c => ''+c.charCodeAt(0)).join('')
  return colors[Math.floor(seed(num) * colors.length)]
}

let debug = false

export default function log(...args) {
  if (!debug) return

  // was to colorize output
  // if (
  //   typeof args[0] == 'string' &&
  //   args[0].indexOf(':') > 0
  // ) {
  //   const args0 = args[0].split(':')
  //   const ident = args0.shift()
  //   console.log((ident + ':' + args0.join(':'))[color(ident)], ...args.splice(1))
  //   return
  // }

  console.log(...args)
}

log.setLogging = function() {
  debug = opts.get('debug')
}