import path from 'path'
import log from './lib/log'
import { p, sanitize } from './lib/fns'

let OPTS

function set(key, val) {
  log(arguments.callee.caller.name, 'opts.set'.bold.yellow, key, val)
  OPTS[key] = val
  return val
}

function get(key) {
  if (key != 'deps') log(arguments.callee.caller.name, 'opts.get'.bold.green, key, OPTS[key])
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

  // base dirs
  OPTS.modulesDir = p(__dirname, '..', '..', 'node_modules')
  OPTS.appDir = opts.appDir
  OPTS.dir = OPTS.dir || opts.appDir
  OPTS.flintDir = p(OPTS.dir || opts.appDir, '.flint')
  OPTS.internalDir = p(OPTS.flintDir, '.internal')
  OPTS.depsDir = p(OPTS.internalDir, 'deps')
  OPTS.template = OPTS.template || '.flint/index.html'
  OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(OPTS.flintDir, 'build')

  // deps dirs
  OPTS.deps = {}
  OPTS.deps.dir = p(OPTS.internalDir, 'deps')
  OPTS.deps.internalsIn = p(OPTS.deps.dir, 'internals.in.js')
  OPTS.deps.internalsOut = p(OPTS.deps.dir, 'internals.js')
  OPTS.deps.depsJS = p(OPTS.deps.dir, 'deps.js')
  OPTS.deps.depsJSON = p(OPTS.deps.dir, 'deps.json')
  OPTS.deps.packagesJS = p(OPTS.deps.dir, 'packages.js')

  OPTS.configFile = p(OPTS.internalDir, 'flint.json')
  OPTS.outDir = p(OPTS.internalDir, 'out')
  OPTS.styleDir = p(OPTS.internalDir, 'styles')
  OPTS.styleOutDir = p(OPTS.buildDir, '_', 'styles.css')

  OPTS.name = path.basename(process.cwd())
  OPTS.saneName = sanitize(OPTS.name)

  var folders = OPTS.dir.split('/')
  OPTS.name = folders[folders.length - 1]
  OPTS.url = OPTS.name + '.dev'

  return OPTS
}

export default { get, set, setAll }