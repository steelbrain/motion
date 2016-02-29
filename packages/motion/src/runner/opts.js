import path from 'path'
import { p, log, move, replace, sanitize, handleError, readFile, writeFile, exists, emitter } from './lib/fns'
import disk from './disk'
import util from 'util'
import webpack from 'webpack'
import getWebpackErrors from './bundler/lib/getWebpackErrors'

let OPTS = {}

export async function init(cli) {
  emitter.on('debug', () => {
    print("---------opts---------")
    debug()
  })

  try {
    // init
    OPTS.appDir = path.normalize(process.cwd())
    OPTS.name = cli.name || path.basename(process.cwd())
    OPTS.saneName = sanitize(cli.name)
    OPTS.hasRunInitialBuild = false
    OPTS.defaultPort = 4000

    setupCliOpts(cli)
    setupDirs()

    // from flint
    await migration()

    // config
    const config = await loadConfigs(cli)
    setupConfig(cli, config)
  }
  catch(e) {
    handleError(e)
  }
}

// TODO remove in minor
async function migration() {
  let flintDir = p(OPTS.appDir, '.flint')

  if (await exists(flintDir)) {
    // .flint => .motion
    await move(flintDir, OPTS.motionDir)

    // index.html "#_flintapp" => "#_motionapp"
    replace({
      regex: '_flintapp',
      replacement: '_motionapp',
      paths: [OPTS.motionDir],
      recursive: true,
      silent: true
    })

    // .motion/flint.json => .motion/config.js
    const oldConfLoc = p(OPTS.motionDir, 'flint.json')
    if (await exists(oldConfLoc)) {
      print(`  Migrating flint config to motion (flint.json => config.js)...\n`)
      await move(oldConfLoc, OPTS.configFile)
      // add module.exports
      const oldConf = await readFile(OPTS.configFile)
      await writeFile(OPTS.configFile, `module.exports = ${oldConf}`)
    }
  }
}

async function loadConfigs() {
  let result

  try {
    const file = await parseConfig()

    if (file) {
      const out = await readFile(file)
      result = eval(out)
    }
    else {
      print('No .motion/config.js file found!')
    }
  }
  catch(e) {
    handleError(e)
  }

  return modeMergedConfig(result || {})
}

function modeMergedConfig(config) {
  const modeSpecificConfig = config[OPTS.build ? 'build' : 'run']
  const merged = Object.assign({}, config, modeSpecificConfig)
  return merged
}

function parseConfig() {
  return new Promise(async (resolve, reject) => {
    try {
      if (!(await exists(OPTS.configFile)))
        resolve(false)

      // for json loader
      const runnerRoot = path.resolve(path.join(__dirname, '..', '..'))
      const runnerModules = path.join(runnerRoot, 'node_modules')

      webpack({
        context: OPTS.motionDir,
        entry: './config.js',
        output: {
          filename: 'user-config.js',
          path: './.motion/.internal',
          libraryTarget: 'commonjs2'
        },
        module: {
          loaders: [
            { test: /\.json$/, loader: 'json' }
          ]
        },
        resolveLoader: { root: runnerModules },
      }, (err, stats) => {
        let error = getWebpackErrors('config', err, stats)

        if (error)
          reject(error)
        else
          resolve(p(OPTS.internalDir, 'user-config.js'))
      })
    }
    catch(e) {
      reject(e)
    }
  })
}

async function setupCliOpts(cli) {
  OPTS.version = cli.version
  OPTS.debug = cli.debug
  OPTS.watch = cli.watch
  OPTS.reset = cli.reset
  OPTS.build = cli.build
  OPTS.out = cli.out

  OPTS.watching = cli.watch || !cli.build

  // ensure we dont clobber things
  if (cli.out && (await exists(cli.out)))  {
    console.error(`\n  Build dir already exists! Ensure you target an empty directory.\n`.red)
    process.exit(1)
  }
}

function setupDirs() {
  // base dirs
  OPTS.motionDir = p(OPTS.appDir, '.motion')
  OPTS.modulesDir = p(OPTS.appDir, 'node_modules')
  OPTS.internalDir = p(OPTS.motionDir, '.internal')
  OPTS.template = OPTS.template || '.motion/index.html'
  OPTS.buildDir = OPTS.out ? p(OPTS.out) : p(OPTS.motionDir, 'build')

  // deps dirs
  OPTS.deps = {}
  OPTS.deps.dir = p(OPTS.internalDir, 'deps')
  OPTS.deps.internalDir = p(OPTS.internalDir, 'deps', 'internal')
  OPTS.deps.assetsDir = p(OPTS.deps.dir, 'assets')
  OPTS.deps.internalsIn = p(OPTS.internalDir, 'internals.in.js')
  OPTS.deps.internalsOut = p(OPTS.deps.dir, 'internals.js')
  OPTS.deps.externalsIn = p(OPTS.deps.dir, 'externals.in.js')
  OPTS.deps.externalsOut = p(OPTS.deps.dir, 'externals.js')
  OPTS.deps.externalsPaths = p(OPTS.deps.dir, 'externals.paths.js')

  OPTS.configFile = p(OPTS.motionDir, 'config.js')
  OPTS.stateFile = p(OPTS.internalDir, 'state.json')
  OPTS.outDir = p(OPTS.internalDir, 'out')
  OPTS.hotDir = p(OPTS.internalDir, 'hot')
  OPTS.styleDir = p(OPTS.internalDir, 'styles')
  OPTS.styleOutDir = p(OPTS.buildDir, '_')
  OPTS.styleOutName = 'styles.css'
}

function setupConfig(cli, config) {
  // config
  OPTS.config = Object.assign(
    // defaults TODO move somewhere nice
    {
      minify: true,
      debug: false,
      routing: true,
      entry: 'main.js'
    },
    config
  )

  // cli overrides config
  if (cli.nomin) OPTS.config.minify = false
  if (cli.pretty) OPTS.config.pretty = true
  if (cli.port) OPTS.config.port = cli.port
  if (cli.host) OPTS.config.host = cli.host
  if (cli.entry) OPTS.config.entry = cli.entry
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
  print(util.inspect(OPTS, false, 10))
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
