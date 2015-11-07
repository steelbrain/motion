import _ from 'lodash'
import readInstalled from './lib/readInstalled'
import handleError from '../lib/handleError'
import log from '../lib/log'
import { onStart, onFinish, onError } './messages'
import { normalize } from './helpers'
import remakeInstallDir from './lib/remakeInstallDir'
import { uninstall } from './uninstall'
import { bundleExternals } from './externals'
import { bundleInternals, writeInternalsIn } from './internals'

// ensures all packages installed, uninstalled, written out to bundle
export async function install(force) {
  log('npm: install')
  try {
    await remakeInstallDir(force)
    await uninstall()
    await installAll()
    await bundleExternals()

    if (force) {
      await writeInternalsIn()
      await bundleInternals()
    }
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

export async function installAll(deps) {
  if (!deps) deps = cache.getImports()

  // full names keeps paths like 'babel/runtime/etc'
  if (deps.length)
    installingFullNames.push(deps)

  const prevInstalled = await readInstalled()
  const fresh = _.difference(normalize(deps), normalize(prevInstalled), installing)

  // no new ones found
  if (!fresh.length) {
    if (!_isInstalling)
      opts.set('hasRunInitialInstall', true)

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
      successful.push(dep)
      onFinish(dep)
    }
    catch(e) {
      failed.push(dep)
      log('package install failed', dep)
      onError(dep, e)
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
