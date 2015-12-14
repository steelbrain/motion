import { Promise } from 'bluebird'
import readInstalled from './lib/readInstalled'
import writeInstalled from './lib/writeInstalled'
import { _, log, handleError } from '../lib/fns'
import cache from '../cache'
import opts from '../opts'
import { onStart, onFinish, onError } from './lib/messages'
import { save } from './lib/npm'
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

    if (force)
      await bundleInternals()

  } catch(e) {
    handleError(e)
    throw new Error(e)
  }
}

let successful = []
let failed = []
let installingFullNames = []
let installing = []
let _isInstalling = false

export async function installAll(toInstall) {
  try {
    log(LOG, 'installAll')

    if (!toInstall)
      toInstall = cache.getImports()

    log(LOG, 'toInstall', toInstall)

    // full names keeps paths like 'babel/runtime/etc'
    if (toInstall.length)
      installingFullNames.push(toInstall)
    else {
      if (!_isInstalling && opts.get('hasRunInitialBuild'))
        opts.set('hasRunInitialInstall', true)

      return
    }

    const _toInstall = normalize(toInstall)
    const prevInstalled = await readInstalled()
    const _prevInstalled = normalize(prevInstalled)
    const fresh = _.difference(_toInstall, _prevInstalled, installing)
    log(LOG, 'installAll/fresh = ', fresh, ' = ')
    log(LOG, '  =', _toInstall, '(toInstall) - ', _prevInstalled, '(prevInstalled) - ', installing, '(currently installing)')

    // no new ones found
    if (!fresh.length) {
      if (!_isInstalling)
        opts.set('hasRunInitialInstall', true)

      await writeInstalled(prevInstalled)
      await bundleExternals({ silent: true })
      return
    }

    // push installing
    installing = installing.concat(fresh)

    // check if installed running
    if (_isInstalling) {
      return await finishedInstalls()
    }

    _isInstalling = true

    await runInstall(prevInstalled)
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
      await save(dep)
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
    if (installing.length)
      installNext()
    else
      done()
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
  console.log()
  console.log(`  Installed ${deps.length} packages`.bold)
  deps.forEach(dep => {
    console.log(`  ✓ ${dep}`.green)
  })
  console.log()
}

// check for install finish
export function finishedInstalling() {
  return new Promise(finishedInstallingLoop)
}

function isDone() {
  return opts.get('build')
    ? !_isInstalling && opts.get('hasRunInitialInstall')
    : !_isInstalling
}

function finishedInstallingLoop(res) {
  if (isDone()) res()
  else {
    setTimeout(() => finishedInstallingLoop(res), 100)
  }
}
