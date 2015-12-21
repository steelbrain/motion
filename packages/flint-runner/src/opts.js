import path from 'path'
import log from './lib/log'
import { p, sanitize } from './lib/fns'
import { writeState } from './internal'
import util from 'util'

let OPTS

function set(key, val) {
  log('opts.set'.bold.yellow, key, val)
  OPTS[key] = val
  return val
}

function get(key) {
  // if (key != 'deps') log('opts.get'.bold.green, key, OPTS[key])
  return key ? OPTS[key] : OPTS
}

function setAll(opts) {
  // from cli
  OPTS = {}

  OPTS.version = opts.version
  OPTS.debug = opts.debug
  OPTS.port = opts.port
  OPTS.host = opts.host
  OPTS.watch = opts.watch
  OPTS.pretty = opts.pretty
  OPTS.reset = opts.reset
  OPTS.cached = opts.cached

  OPTS.hasRunInitialBuild = false
  OPTS.build = opts.isBuild

  OPTS.defaultPort = 4000

  // base dirs
  OPTS.appDir = opts.appDir
  OPTS.dir = OPTS.dir || opts.appDir
  OPTS.flintDir = p(OPTS.dir || opts.appDir, '.flint')
  OPTS.nodeDir = p(OPTS.flintDir, 'node_modules')
  OPTS.internalDir = p(OPTS.flintDir, '.internal')
  OPTS.depsDir = p(OPTS.internalDir, 'deps')
  OPTS.template = OPTS.template || '.flint/index.html'
  OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(OPTS.flintDir, 'build')

  // deps dirs
  OPTS.deps = {}
  OPTS.deps.dir = p(OPTS.internalDir, 'deps')
  OPTS.deps.internalsIn = p(OPTS.deps.dir, 'internals.in.js')
  OPTS.deps.internalsOut = p(OPTS.deps.dir, 'internals.js')
  OPTS.deps.externalsIn = p(OPTS.deps.dir, 'externals.in.js')
  OPTS.deps.externalsOut = p(OPTS.deps.dir, 'externals.js')
  OPTS.deps.externalsPaths = p(OPTS.deps.dir, 'externals.paths.js')

  OPTS.configFile = p(OPTS.flintDir, 'flint.json')
  OPTS.stateFile = p(OPTS.internalDir, 'state.json')
  OPTS.outDir = p(OPTS.internalDir, 'out')
  OPTS.styleDir = p(OPTS.internalDir, 'styles')
  OPTS.styleOutDir = p(OPTS.buildDir, '_', 'styles.css')

  OPTS.config = {}

  OPTS.name = path.basename(process.cwd())
  OPTS.saneName = sanitize(OPTS.name)

  var folders = OPTS.dir.split('/')
  OPTS.name = folders[folders.length - 1]
  OPTS.url = OPTS.name + '.dev'

  return OPTS
}

async function serialize() {
  await writeState((state, write) => {
    state.opts = { ...OPTS }
    delete state.opts.state // prevent circle
    write(state)
  })
}

function debug() {
  console.log(util.inspect(OPTS, false, 10))
}

export default { get, set, setAll, serialize, debug }
