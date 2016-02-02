import path from 'path'
import log from './lib/log'
import { p, sanitize, handleError, readJSON } from './lib/fns'
import disk from './disk'
import util from 'util'

let OPTS = {}

export async function init(opts) {
  setup(opts)

  const { flint, babel, webpack } = await loadConfigs()
  OPTS.config = flint
  OPTS.babel = babel
  OPTS.webpack = webpack
}

async function loadConfigs() {
  const flint = await flintConfig()
  return { flint }
}

async function flintConfig() {
  try { return await readJSON(OPTS.configFile) }
  catch(e) { handleError({ message: 'Error parsing config file: .flint/flint.json', stack: e.stack }) }
}

function setup(opts) {
  OPTS = {}
  OPTS.appDir = opts.appDir || path.normalize(process.cwd())
  OPTS.name = opts.name || path.basename(process.cwd())
  OPTS.saneName = sanitize(opts.name)

  // cli

  OPTS.version = opts.version
  OPTS.debug = opts.debug
  OPTS.port = opts.port
  OPTS.host = opts.host
  OPTS.watch = opts.watch
  OPTS.pretty = opts.pretty
  OPTS.reset = opts.reset
  OPTS.cached = opts.cached
  OPTS.nomin = opts.nomin
  OPTS.build = opts.build

  OPTS.hasRunInitialBuild = false
  OPTS.defaultPort = 4000

  // base dirs
  OPTS.flintDir = p(OPTS.appDir, '.flint')
  OPTS.modulesDir = p(OPTS.flintDir, 'node_modules')
  OPTS.internalDir = p(OPTS.flintDir, '.internal')
  OPTS.depsDir = p(OPTS.internalDir, 'deps')
  OPTS.template = OPTS.template || '.flint/index.html'
  OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(OPTS.flintDir, 'build')

  // deps dirs
  OPTS.deps = {}
  OPTS.deps.dir = p(OPTS.internalDir, 'deps')
  OPTS.deps.assetsDir = p(OPTS.deps.dir, 'assets')
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

  var folders = OPTS.appDir.split('/')
  OPTS.name = folders[folders.length - 1]
  OPTS.url = OPTS.name + '.dev'
}

export function set(key, val) {
  log.opts('opts.set'.bold.yellow, key, val)
  OPTS[key] = val
  return val
}

export function get(key) {
  return key ? OPTS[key] : OPTS
}

export async function serialize() {
  await disk.state.write((state, write) => {
    state.opts = { ...OPTS }
    delete state.opts.state // prevent circular structure
    write(state)
  })
}

export function debug() {
  console.log(util.inspect(OPTS, false, 10))
}



// this is bit funky, but lets us do:
//   opts('dir') => path
//   opts.set('dir', 'other')

function opts(name) {
  return get(name)
}

opts.set = set
opts.init = init
opts.serialize = serialize
opts.debug = debug

export default opts