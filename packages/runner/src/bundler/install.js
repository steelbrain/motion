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
    if (!toInstall)
      toInstall = cache.getImports()

    log(LOG, 'toInstall', toInstall)

    // full names keeps paths like 'babel/runtime/etc'
    if (toInstall.length)
      installingFullNames.push(toInstall)
    else {
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
      if (!_isInstalling) opts.set('hasRunInitialInstall', true)
      await writeInstalled(prevInstalled)
      await bundleExternals({ silent: true })
      return
    }

    // push installing
    installing = installing.concat(fresh)

    // check if installed running
    if (_isInstalling) return
    _isInstalling = true

    const installNext = async () => {
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
        installing.shift() // remove
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
      log(LOG, 'finalPaths', finalPaths)

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
    }

    installNext()
  }
  catch(e) {
    handleError(e)
  }
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

function isInstalling() {
  return _isInstalling
}

function finishedInstallingLoop(res) {
  if (!_isInstalling) res()
  else {
    setTimeout(() => finishedInstallingLoop(res), 100)
  }
}
