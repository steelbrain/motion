import path from 'path'
import { p } from './lib/fns'

let OPTS

function set(key, val) {
  // bulk setting
  if (!val)
    return setAll(key)
  else {
    OPTS[key] = val
    return val
  }
}

function get(key) {
  return key ? OPTS[key] : OPTS
}

function setAll(opts) {
  // from cli
  OPTS = {}
  OPTS.debug = opts.debug || opts.verbose
  OPTS.port = opts.port
  OPTS.host = opts.host
  OPTS.watch = opts.watch

  OPTS.build = opts.isBuild

  OPTS.defaultPort = 4000
  OPTS.appDir = opts.appDir
  OPTS.dir = OPTS.dir || opts.appDir
  OPTS.flintDir = p(OPTS.dir || opts.appDir, '.flint')
  OPTS.template = OPTS.template || '.flint/index.html'
  OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(OPTS.flintDir, 'build')

  OPTS.configFile = p(OPTS.flintDir, 'flint.json')
  OPTS.outDir = p(OPTS.flintDir, 'out')

  OPTS.name = path.basename(process.cwd())

  var folders = OPTS.dir.split('/')
  OPTS.name = folders[folders.length - 1]
  OPTS.url = OPTS.name + '.dev'

  return OPTS
}

export default { get, set }