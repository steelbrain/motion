import opts from '../opts'

let debug = false

const subIcons = {
  IN: ' ⇠ '.blue,
  OUT: ' ⇢ '.bold.green,
  SIN: ' ⇜ '.magenta,
  SOUT: ' ⇝ '.bold.yellow,
  RELOAD: ' ↺ '.yellow,
  STAR: ' ★ '.yellow,
  PIPE: ' | '.gray,
  CHECK: ' ✓ ',
  X: ' ✖ ',
  PLUS: ' ✚ ',
  ASTERISK: ' ✺ ',
  HAPPY: ' ☺ ',
  SAD: ' ☹ ',
  RELOAD: ' ↺ ',
  WRITE: ' ✍ ',
  DOWN: ' ↓ ',
  UP: ' ↑ ',
}

export default function log(info, subIcon, ...args) {
  if (!debug) return

  const isStr = typeof info == 'string'
  let name, icon
  if (isStr) name = info
  else ({ name, icon } = info)

  const subi = subIcons[subIcon]
  const subiout = subi ? subi : `     ${subIcon}`
  const doLog = () => console.log(icon, subiout, ...colorArgs(args))

  // all
  if (!debug.length) return doLog()
  // filtered
  if (name && debug.indexOf(name) >= 0) doLog()
}

function colorArgs(args) {
  return args.map(arg =>
    typeof arg === 'boolean' ? !!arg ? `${arg}`.bold.green : `${arg}`.bold.red
    : arg
  )
}

log.setLogging = function() {
  debug = opts('debug')
}