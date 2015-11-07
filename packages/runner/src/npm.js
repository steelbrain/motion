import { Promise } from 'bluebird'
import { Spinner } from './lib/console'
import fs from 'fs'
import webpack from 'webpack'
import _ from 'lodash'
import bridge from './bridge'
import opts from './opts'
import cache from './cache'
import handleError from './lib/handleError'
import findExports from './lib/findExports'
import exec from './lib/exec'
import { readConfig, writeConfig } from './lib/config'
import log from './lib/log'
import { touch, p, mkdir, rmdir, readFile, writeFile, writeJSON, readJSON } from './lib/fns'

let WHERE = {}
let OPTS
let INSTALLING = false

/*

  Public:
   - init: set options
   - install: checks installed and reinstalls based on current cache
   - scanFile: checks for imports in file and installs/caches

  Private:
   - bundleExternals: write cache/installed + pack
     - pack: deps.js => packages.js (bundleExternals)
   - setInstalled: cache => package.json.installed
   - writeDeps: deps => deps.js

*/

async function init(_opts) {
  OPTS = _opts

  WHERE.outDir = p(OPTS.internalDir, 'deps')
  WHERE.internalsInJS = p(WHERE.outDir, 'internals.in.js')
  WHERE.internalsOutJS = p(WHERE.outDir, 'internals.js')
  WHERE.depsJS = p(WHERE.outDir, 'deps.js')
  WHERE.depsJSON = p(WHERE.outDir, 'deps.json')
  WHERE.packagesJS = p(WHERE.outDir, 'packages.js')

  await remakeInstallDir()
}


// messaging

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


// readers / writers

const externals = [ 'flint-js', 'react', 'react-dom', 'bluebird' ]
const rmFlintExternals = ls => ls.filter(i => externals.indexOf(i) < 0)
const installKey = 'installed'

async function readInstalled() {
  try {
    const config = await readConfig()
    const installed = config[installKey] || []
    log('readInstalled()', installed)
    return installed
  }
  catch(e) {
    handleError(e)
  }
}

async function writeInstalled(deps) {
  try {
    log('writeInstalled()', deps)
    const config = await readConfig()
    config[installKey] = rmFlintExternals(deps)
    await writeConfig(config)
  }
  catch(e) {
    handleError(e)
  }
}

async function getWritten() {
  try {
    const written = await readJSON(WHERE.depsJSON)
    return written.deps
  }
  catch(e) {
    log('npm: install: no deps installed')
    return []
  }
}


// helpers

const filterFalse = ls => ls.filter(l => !!l)

 // ['pkg/x', 'pkg/y'] => ['pkg'] and remove flint externals
const normalize = deps =>
  rmFlintExternals(_.uniq(deps.map(dep => dep.indexOf('/') ? dep.replace(/\/.*/, '') : dep)))



async function removeOld(rebundle) {
  const installed = await readInstalled()
  const imported = cache.getImports()
  const toUninstall = _.difference(normalize(installed), normalize(imported))
  log('npm: removeOld() toUninstall', toUninstall)

  if (!toUninstall.length) return

  console.log(`\n  Uninstalling...`.bold)
  const attempted = await* toUninstall.map(async dep => {
    try {
      await unsave(dep, toUninstall.indexOf(dep), toUninstall.length)
      console.log(`  ✘ ${dep}`.red)
      return dep
    }
    catch(e) {
      console.log('Failed to uninstall', dep)
      return false
    }
  })

  const success = filterFalse(attempted)
  const final = _.difference(installed, success)
  log('writing from removeOld()', final)
  await writeInstalled(final)

  if (rebundle) {
    await bundleExternals()
  }

  return success
}

async function remakeInstallDir(redo) {
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

function promiseTimeout(delay) {
  return new Promise((res, rej) => {
    setTimeout(res, delay)
  })
}


// ensures all packages installed, uninstalled, written out to bundle
async function install(force) {
  log('npm: install')
  try {
    await remakeInstallDir(force)
    await removeOld()
    await installAll()
    await bundleExternals()
  } catch(e) {
    handleError(e)
    throw new Error(e)
  }
}

// => deps.json
// => deps.js
const depRequireString = (name, onto, pathname = '') => `
  try {
    Flint.${onto}["${name}"] = require("${pathname}${name}")
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
  const requireString = deps.map(name => {
    return depRequireString(name, 'packages')
  }).join('')
  await writeFile(WHERE.depsJS, requireString)
}

// allInstalled() => packExternals()
async function bundleExternals() {
  log('npm: bundleExternals')
  const installed = await readInstalled()
  await writeDeps(installed)
  await packExternals()
  onPackagesInstalled()
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
    checkInternals(file, source)
    installExternals(file, source)
  }
  catch (e) {
    console.log('Error installing imports!')
    console.log(e)
    console.log(e.message)
  }
}

// TODO: check this in babel to be more accurate
// we bundle any internal file that uses:
//    exports.xyz, exports['default']
async function checkInternals(file, source) {
  log('checkInternals', file)

  const isExporting = findExports(source)
  const alreadyExported = cache.isExported(file)
  log('checkInternals: found', isExporting, 'already', alreadyExported)

  cache.setExported(file, isExporting)

  // needs to rewrite internalsIn.js?
  if (!alreadyExported && isExporting || alreadyExported && !isExporting) {
    await writeInternalsIn()
  }

  if (isExporting)
    bundleInternals()
}

async function writeInternalsIn() {
  log('writeInternalsIn')
  const files = cache.getExported()
  if (!files.length) return

  const requireString = files.map(f =>
    depRequireString(f.replace(/\.js$/, ''), 'internals', './internal/')).join('')

  await writeFile(WHERE.internalsInJS, requireString)
}

export async function bundleInternals() {
  await packInternals()
  bridge.message('internals:reload', {})
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
      }
    }, async err => {
      if (err) {
        console.error(err.stack)
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
  cache.setFileImports(file, found)
  installAll(found)
}

let successful = []
let failed = []
let installingFullNames = []
let installing = []
let _isInstalling = false

async function installAll(deps) {
  if (!deps) deps = cache.getImports()

  // full names keeps paths like 'babel/runtime/etc'
  if (deps.length)
    installingFullNames.push(deps)

  const prevInstalled = await readInstalled()
  const fresh = _.difference(normalize(deps), normalize(prevInstalled), installing)

  // no new ones found
  if (!fresh.length) return

  // push installing
  installing = installing.concat(fresh)

  // check if installed running
  if (_isInstalling) return
  _isInstalling = true

  const installNext = async () => {
    const dep = installing[0]
    onPackageStart(dep)

    try {
      await save(dep)
      successful.push(dep)
      onPackageFinish(dep)
    }
    catch(e) {
      failed.push(dep)
      log('package install failed', dep)
      onPackageError(dep, e)
    }
    finally {
      installing.shift() // remove
      next()
    }
  }

  const next = () => installing.length ? installNext() : done()

  async function done() {
    const installedFullPaths = _.flattenDeep(_.compact(_.uniq(installingFullNames)))
    let final = [].concat(prevInstalled, installedFullPaths)

    // remove failed
    if (failed.length)
      final = final.filter(dep => failed.indexOf(dep) >= 0)

    logInstalled(successful)
    await writeInstalled(final)
    await bundleExternals()

    // reset
    installingFullNames = []
    failed = []
    _isInstalling = false
    opts.set('hasRunInitialInstall', true)
  }

  installNext()
}

function logProgress(tag, name, index, total) {
  if (!opts.get('hasRunInitialBuild')) {
    return
  }

  log('npm', tag, name)

  const out = total ?
    ` ${index+1} of ${total}: ${name}` :
    `${tag}: ${name}`

  if (OPTS.build)
    console.log(out)
  else {
    console.log()
    let spinner = new Spinner(out)
    spinner.start({ fps: 30 })
    return spinner
  }
}

function execPromise(name, cmd, dir, spinner) {
  return new Promise((res, rej) => {
    exec(cmd, dir, (err, stdout, stderr) => {
      if (spinner) spinner.stop()
      if (err) rej(err)
      else res(name)
    })
  })
}

async function progressTask(label, cmd, name, index, total) {
  try {
    const spinner = logProgress(label, name, index, total)
    await execPromise(name, cmd, OPTS.flintDir, spinner)
  }
  catch(e) {
    handleError(e)
  }
}

// npm install --save 'name'
async function save(name, index, total) {
  await progressTask('Installing', 'npm install --save ' + name, name, index, total)
}

// npm uninstall --save 'name'
async function unsave(name, index, total) {
  await progressTask('Uninstalling', 'npm uninstall --save ' + name, name, index, total)
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
        'react-dom': 'ReactDOM'
      },
      output: {
        filename: WHERE.packagesJS
      }
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
  console.log(`  Installed ${deps.length} packages`.bold)
  deps.forEach(dep => {
    console.log(`  ✓ ${dep}`.green)
  })
  console.log()
}

function isInstalling() {
  return _isInstalling
}

function finishedInstalling() {
  return new Promise(finishedInstallingLoop)
}

function finishedInstallingLoop(res) {
  if (!_isInstalling) res()
  else {
    setTimeout(() => finishedInstallingLoop(res), 100)
  }
}

export default { init, install, scanFile, bundleInternals, removeOld, isInstalling, finishedInstalling }