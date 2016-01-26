import { readInstalled } from './lib/readInstalled'
import writeInstalled from './lib/writeInstalled'
import { _, log, handleError } from '../lib/fns'
import cache from '../cache'
import opts from '../opts'
import { onStart, onFinish, onError } from './lib/messages'
import npm from './lib/npm'
import normalize from './lib/normalize'
import remakeInstallDir from './lib/remakeInstallDir'
import { uninstall } from './uninstall'
import { bundleExternals } from './externals'
import { bundleInternals } from './internals'

const LOG = 'externals'

// ensures all packages installed, uninstalled, written out to bundle
export async function install(force) {
  log('bundler', 'install')
  try {
    await remakeInstallDir(force)
    await uninstall()
    await installAll()
    await bundleExternals()
  }
  catch (e) {
    handleError(e)
    throw new Error(e)
  }
}

let successful = []
let failed = []
let installingFullNames = []
let installing = []
let _isInstalling = false

function getToInstall(requires) {
  return requires
}

// used to quickly check if a file will trigger an install
export async function willInstall(filePath) {
  const required = cache.getExternals(filePath)
  const fresh = await getNew(required)
  return !!fresh.length
}

// finds the new externals to install
export async function getNew(requires, installed) {
  // get all installed
  installed = installed || await readInstalled()

  const names = normalize(requires)
  const fresh = _.difference(names, installed, installing)
  log(LOG, 'getNew():', fresh, '(fresh) = ', names, '(names) -', installed, '(installed) -', installing, '(installing)')
  return fresh
}

export async function installAll(requires) {
  log(LOG, 'installAll')
  try {
    requires = requires || cache.getExternals()

    // nothing to install
    if (!requires.length && !_isInstalling && opts('hasRunInitialBuild'))
      opts.set('hasRunInitialInstall', true)

    // determine whats new
    const installed = await readInstalled()
    const fresh = await getNew(requires, installed)

    log(LOG, 'installAll requires', requires, 'installed', installed, 'fresh', fresh)

    // nothing new
    if (!fresh.length) {
      if (!_isInstalling) opts.set('hasRunInitialInstall', true)

      // new flint excluded require like babel-runtime, see rmFlintExternals
      // TODO this, getNew, normalize all need refactor -- in fact probably most of this file does :)
      if (requires.length) {
        await writeInstalled(installed)
        await bundleExternals({ silent: true })
      }
      return
    }

    // track full require paths "babel-runtime/interop/etc"
    installingFullNames = installingFullNames.concat(requires)

    // push installing
    installing = installing.concat(fresh)

    // check if already installing stuff
    if (_isInstalling)
      return await finishedInstalls()

    // install!
    _isInstalling = true
    await runInstall(installed)
  }
  catch(e) {
    handleError(e)
  }
}

function runInstall(prevInstalled, toInstall) {
  let isDone = false

  async function installNext() {
    const dep = installing[0]
    onStart(dep)

    try {
      await npm.save(dep)
      log(LOG, 'install', 'succces, saved', dep)
      successful.push(dep)
      onFinish(dep)
    }
    catch(e) {
      console.error(`Error installing ${dep}`, e.message)
      failed.push(dep)
      log(LOG, 'package install failed', dep, e.message, e.stack)
      onError(dep, e)
    }
    finally {
      let installed = installing.shift()

       // remove
      log(LOG, 'install, finally:', installing)
      next()
    }
  }

  function next() {
    log(LOG, 'next #', installing.length)
    return installing.length ? installNext() : done()
  }

  async function done() {
    const installedFullPaths = _.flattenDeep(_.compact(_.uniq(installingFullNames)))
    let finalPaths = _.uniq([].concat(prevInstalled, installedFullPaths))
    log(LOG, 'DONE, finalPaths', finalPaths)

    // remove failed
    if (failed && failed.length)
      finalPaths = finalPaths.filter(dep => failed.indexOf(dep) >= 0)

    logInstalled(successful)
    await writeInstalled(finalPaths, toInstall)
    await bundleExternals()

    // reset
    installingFullNames = []
    failed = []
    _isInstalling = false
    opts.set('hasRunInitialInstall', true)
    isDone = true
  }

  return new Promise(res => {
    // start
    installNext()

    let finish = setInterval(() => {
      if (isDone) {
        clearInterval(finish)
        finishedWatchers.forEach(w => w())
        res()
      }
    }, 50)
  })
}

// to ensure we wait for installs
let finishedWatchers = []
function finishedInstalls() {
  return new Promise(res => {
    finishedWatchers.push(() => {
      res()
    })
  })
}

function logInstalled(deps) {
  if (!deps.length) return
  console.log(`\n  Installed ${deps.length} packages`.bold)
  deps.forEach(dep => console.log(`  ✓ ${dep}`.green))
}

export function isInstalling() {
  log(LOG, 'isInstalling()', _isInstalling)
  return _isInstalling
}

// check for install finish
export function finishedInstalling() {
  return new Promise(finishedInstallingLoop)
}

function isDone() {
  return opts('build')
    ? !_isInstalling && opts('hasRunInitialInstall')
    : !_isInstalling
}

function finishedInstallingLoop(res) {
  if (isDone()) res()
  else {
    setTimeout(() => finishedInstallingLoop(res), 100)
  }
}
