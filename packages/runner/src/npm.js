import { Promise } from 'bluebird'
import { Spinner } from './lib/console'
import fs from 'fs'
import webpack from 'webpack'
import _ from 'lodash'
import bridge from './bridge'
import cache from './cache'
import handleError from './lib/handleError'
import exec from './lib/exec'
import log from './lib/log'
import { touch, p, mkdir, rmdir, readFile, writeFile, writeJSON, readJSON } from './lib/fns'

let WHERE = {}
let OPTS
let INSTALLING = false
let FIRST_RUN = true

/*

  Public:
   - init: set options
   - install: checks all imports (cache + package.json.installed) and bundleExternalss
   - scanFile: checks for imports in file and installs/caches

  Private:
   - bundleExternals: write cache/installed + pack
     - pack: deps.js => packages.js (bundleExternals)
   - setInstalled: cache => package.json.installed
   - writeDeps: deps => deps.js

*/

function init(_opts) {
  OPTS = _opts

  WHERE.outDir = p(OPTS.flintDir, 'deps')
  WHERE.internalsInJS = p(WHERE.outDir, 'internals.in.js')
  WHERE.internalsOutJS = p(WHERE.outDir, 'internals.js')
  WHERE.depsJS = p(WHERE.outDir, 'deps.js')
  WHERE.depsJSON = p(WHERE.outDir, 'deps.json')
  WHERE.packagesJS = p(WHERE.outDir, 'packages.js')
  WHERE.packageJSON = p(OPTS.flintDir, 'package.json')
}

async function mkDir(redo) {
  if (redo)
    await rmdir(WHERE.depsJSON)

  await mkdir(WHERE.outDir)
  await* [
    touch(WHERE.depsJSON),
    touch(WHERE.depsJS),
    touch(WHERE.packagesJS),
    touch(WHERE.internalsOutJS)
  ]
}

const onPackageStart = (name) => {
  if (OPTS.build) return
  bridge.message('package:install', { name })
}

const onPackageError = (name, error) => {
  if (OPTS.build) return
  bridge.message('package:error', { name, error })
  bridge.message('npm:error', { error })
}

const onPackageFinish = (name) => {
  if (OPTS.build) return
  log('runner: onPackageFinish: ', name)
  bridge.message('package:installed', { name })
}

const onPackagesInstalled = () => {
  if (OPTS.build) return
  bridge.message('packages:reload', {})
}

const externals = [
  'flint-js',
  'react',
  'react-dom',
  'bluebird'
]

const rmFlintExternals = ls => ls.filter(i => externals.indexOf(i) < 0)

/*

  ensures all packages both in files and in package.json.installed
  are written out to the bundled js file

*/
async function install(force) {
  log('npm: install')
  try {
    // ensure deps dir
    await mkDir(force)

    // write out to package.installed
    const allInstalled = await setInstalled()

    log('npm: install: allInstalled:', allInstalled)

    // remove externals
    const installed = rmFlintExternals(allInstalled)

    // written = packages already written out to js bundle
    let written = []
    try {
      const installed = await readJSON(WHERE.depsJSON)
      written = rmFlintExternals(installed.deps)
    }
    catch(e) {
      log('npm: install: no deps installed')
    }
    log('npm: install: written:', written)


    // install unwritten
    const un = _.difference(installed, written)
    log('npm: install: un: ', un)
    if (un.length) {
      console.log("\n",'Installing Packages...'.white.bold)

      for (let dep of un) {
        console.log(dep)
        try {
          await save(dep, un.indexOf(dep), un.length)
        }
        catch(e) {
          console.log('Failed to install', dep)
        }
      }

      await bundleExternals()
      onPackagesInstalled()
    }

    FIRST_RUN = false
    return installed
  } catch(e) {
    handleError(e)
    throw new Error(e)
  }
}

// => deps.json
// => deps.js
const depRequireString = (name, onto = '__flintPackages', pathname = '') => `
  try {
    window.${onto}["${name}"] = require("${pathname}${name}")
  }
  catch(e) {
    console.log('Error running package!')
    console.error(e)
  };
`

// package.json.installed => deps.js
async function writeDeps(deps = []) {
  log('npm: writeDeps:', deps)
  await writeJSON(WHERE.depsJSON, { deps })
  const requireString = deps.map(depRequireString).join('')
  await writeFile(WHERE.depsJS, requireString)
}

// allInstalled() => packExternals()
async function bundleExternals() {
  log('npm: bundleExternals')
  const installed = await getAllExternals()
  await writeDeps(installed)
  await packExternals()
}

async function getAllExternals() {
  const fileImports = cache.getImports()
  const pkg = await readJSON(WHERE.packageJSON)

  const all = _.union(pkg.installed, fileImports)
    .filter(x => typeof x == 'string')

  log('npm: getAllExternals: all:', all)
  return all
}

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

// <= file, source
//  > install new deps
// => update cache
function scanFile(file, source) {
  log('scanFile', file)
  try {
    // install new stuff
    installInternals(file, source)
    installExternals(file, source)
  }
  catch (e) {
    console.log('Error installing imports!')
    console.log(e)
    console.log(e.message)
  }
}

const findExports = source =>
  /exports(\[\'default\'\]|\.[a-zA-Z\$\_]+) \=/g.test(source)

// TODO: check this in babel to be more accurate
// we bundle any internal file that uses:
//    exports.xyz, exports['default']
function installInternals(file, source) {
  log('installInternals', file)

  if (OPTS.build) return

  const foundExports = findExports(source)
  const alreadyExported = cache.isExported(file)

  log('installInternals: foundExports', foundExports,
    'already exported?', alreadyExported)

  // check for newly exported
  if (!alreadyExported && foundExports) {
    log('new internal', file)
    cache.setIsExported(file)
    bundleInternals(cache.getExported())
  }
}

async function bundleInternals(files) {
  log('bundleInternals', files)

  const requireString = files.map(f =>
    depRequireString(f.replace(/\.js$/, ''), '__flintInternals', './internal/')).join('')

  await writeFile(WHERE.internalsInJS, requireString)
  await packInternals()
  bridge.message('internals:reload')
}

function packInternals() {
  log('packInternals')
  return new Promise((res, rej) => {
    webpack({
      entry: WHERE.internalsInJS,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        'react-dom': 'ReactDOM'
      },
      output: {
        filename: WHERE.internalsOutJS
      },
      devtool: 'source-map'
    }, async err => {
      if (err) {
        console.log(err)
        return rej(err)
      }

      log('npm: pack: finished')
      res()
    })
  })
}

const findExternalRequires = source =>
  findRequires(source).filter(x => x.charAt(0) != '.')

async function installExternals(file, source) {
  log('installExternals', file)
  const found = findExternalRequires(source)
  const already = await getAllExternals()
  const fresh = found.filter(e => already.indexOf(e) < 0)

  log('installExternals: Found packages in file:', found)
  log('installExternals: New external packages:', fresh)

  // no new ones found
  if (!fresh.length) return

  let installed = []
  let installing = fresh

  INSTALLING = true

  // install deps one by one
  const installNext = async () => {
    const dep = installing.shift()
    log('installExternals: start install:', dep)
    onPackageStart(dep)

    try {
      await save(dep)
      log('installExternals: package installed', dep)
      installed.push(dep)
      onPackageFinish(dep)
      next()
    } catch(e) {
      log('installExternals: package install failed', dep)
      onPackageError(dep, e)
      next()
    }
  }

  // loop
  const next = () => {
    log('installExternals: installing.length', installing.length)
    if (installing.length) return installNext()
    done()
  }

  const done = async () => {
    // cache newly installed + already
    cache.setFileImports(file, installed.concat(already))
    logInstalled(installed)
    afterScansClear()

    if (!FIRST_RUN) {
      log('npm: installExternals', '!firstrun, bundleExternals()')
      await bundleExternals()
      onPackagesInstalled()
    }
  }

  installNext()
}

// npm install --save 'name'
function save(name, index, total) {
  let spinner
  const out = total ?
    ` ${index+1} of ${total}: ${name}` :
    `Installing: ${name}`

  if (OPTS.build)
    console.log(out)
  else {
    spinner = new Spinner(out)
    spinner.start({ fps: 30 })
  }

  log('npm: save:', name)
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, OPTS.flintDir, (err, stdout, stderr) => {
      if (spinner) spinner.stop()
      if (err) rej({ msg: stderr, name })
      else res(name)
    })
  })
}

// all found installs => package.json.installed
async function setInstalled() {
  log('npm: setInstalled')
  await afterScans()

  const pkg = await readJSON(WHERE.packageJSON)
  const all = await getAllExternals()

  pkg.installed = all

  await writeJSON(WHERE.packageJSON, pkg, {spaces: 2})
  return pkg.installed
}

// webpack
// deps.js => packages.js
async function packExternals(file, out) {
  log('npm: pack')
  return new Promise((resolve, reject) => {
    webpack({
      entry: WHERE.depsJS,
      externals: {
        react: 'React',
        bluebird: '_bluebird',
        // 'react-dom': 'ReactDOM'
      },
      output: {
        filename: WHERE.packagesJS
      },
      devtool: 'source-map'
    }, async err => {
      if (err) {
        // undo written packages
        await rmdir(WHERE.depsJSON)
        console.log("Error bundling your packages:", err)
        return reject(err)
      }

      log('npm: pack: finished')
      resolve()
    })
  })
}

// npm install
function installPackage(dir) {
  return new Promise((res, rej) => {
    exec('npm install', dir || OPTS.flintDir, err => {
      if (err) rej(err)
      else res()
    })
  })
}

function getMatches(string, regex, index) {
  index || (index = 1) // default to the first capturing group
  var matches = []
  var match
  while (match = regex.exec(string)) {
    matches.push(match[index])
  }
  return matches
}

function logInstalled(deps) {
  if (!deps.length) return
  console.log()
  console.log(`Installed ${deps.length} packages`.blue.bold)
  deps.forEach(dep => {
    console.log(` - ${dep}`)
  })
  console.log()
}

// wait for installs
let awaitingScans = []
function afterScans() {
  return new Promise((resolve, reject) => {
    log('npm: afterScans: INSTALLING: ', INSTALLING)
    if (INSTALLING)
      awaitingScans.push(resolve)
    else
      resolve()
  })
}

function afterScansClear() {
  INSTALLING = false
  log('npm: afterScansClear: awaiting:', awaitingScans.length)
  awaitingScans.forEach(res => res())
  awaitingScans = []
}

export default { init, install, scanFile }