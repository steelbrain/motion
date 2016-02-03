import path from 'path'
import log from './lib/log'
import { p, sanitize, handleError, readJSON, readFile, exists } from './lib/fns'
import disk from './disk'
import util from 'util'
import webpack from 'webpack'
import getWebpackErrors from './bundler/lib/getWebpackErrors'

let OPTS = {}

export async function init(cli) {
  // init
  OPTS.appDir = path.normalize(process.cwd())
  OPTS.name = cli.name || path.basename(process.cwd())
  OPTS.saneName = sanitize(cli.name)
  OPTS.hasRunInitialBuild = false
  OPTS.defaultPort = 4000

  setupCliOpts(cli)
  setupDirs()

  // config
  const config = await loadConfigs(cli)
  setupConfig(cli, config)
}

function parseConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      try {
        const confLocation = p(OPTS.flintDir, 'config.js')
        await exists(confLocation)
      }
      catch(e) {
        resolve(false)
      }

      // for json loader
      const runnerRoot = path.resolve(path.join(__dirname, '..'))
      const runnerModules = path.join(runnerRoot, 'node_modules')

      webpack({
        context: OPTS.flintDir,
        entry: './config.js',
        output: {
          filename: 'user-config.js',
          path: './.flint/.internal',
          libraryTarget: 'commonjs2'
        },
        module: {
          loaders: [
            { test: /\.json$/, loader: 'json' }
          ]
        },
        resolveLoader: { root: runnerModules },
      }, (err, stats) => {
        const res = () => resolve(p(OPTS.internalDir, 'user-config.js'))
        let error = getWebpackErrors('config', err, stats)
        if (error) resolve(false)
      })
    }
    catch(e) {
      handleError(e)
    }
  })
}

function setupCliOpts(cli) {
  OPTS.version = cli.version
  OPTS.debug = cli.debug
  OPTS.watch = cli.watch
  OPTS.reset = cli.reset
  OPTS.build = cli.build
}

async function loadConfigs() {
  const file = await parseConfig()

  if (file) {
    // const userConf = require('./.flint/.internal/user-config')
    const out = await readFile(file)
    const conf = eval(out)
    return modeMergedConfig(conf)
  }

  return await jsonConfig()
}

function modeMergedConfig(config) {
  const modeSpecificConfig = config[OPTS.build ? 'build' : 'run']
  const merged = Object.assign({}, config, modeSpecificConfig)
  return merged
}

async function jsonConfig() {
  try {
    const config = await readJSON(OPTS.configFile)
    return modeMergedConfig(config)
  }
  catch(e) {
    handleError({ message: `Error parsing config file: ${OPTS.configFile}` })
  }
}

function setupDirs() {
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
}

function setupConfig(cli, config) {
  // config
  OPTS.config = Object.assign(
    {
      minify: true,
      debug: false,
      routing: true
    },
    config
  )

  // cli overrides config
  if (cli.nomin) OPTS.config.minify = false
  if (cli.pretty) OPTS.config.pretty = true
  if (cli.port) OPTS.config.port = cli.port
  if (cli.host) OPTS.config.host = cli.host
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