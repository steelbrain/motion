import path from 'path'
import { p, sanitize } from './lib/fns'

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

  OPTS.debug = opts.debug
  OPTS.port = opts.port
  OPTS.host = opts.host
  OPTS.watch = opts.watch

  OPTS.hasRunInitialBuild = false
  OPTS.build = opts.isBuild

  OPTS.defaultPort = 4000
  OPTS.modulesDir = p(__dirname, '..', '..', 'node_modules')
  OPTS.appDir = opts.appDir
  OPTS.dir = OPTS.dir || opts.appDir
  OPTS.flintDir = p(OPTS.dir || opts.appDir, '.flint')
  OPTS.internalDir = p(OPTS.flintDir, '.internal')
  OPTS.template = OPTS.template || '.flint/index.html'
  OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(OPTS.flintDir, 'build')

  OPTS.configFile = p(OPTS.flintDir, 'flint.json')
  OPTS.outDir = p(OPTS.internalDir, 'out')

  OPTS.name = path.basename(process.cwd())
  OPTS.saneName = sanitize(OPTS.name)

  var folders = OPTS.dir.split('/')
  OPTS.name = folders[folders.length - 1]
  OPTS.url = OPTS.name + '.dev'

  return OPTS
}

export default { get, set }