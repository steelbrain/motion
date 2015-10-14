import { Promise } from 'bluebird'
import { Spinner } from '../lib/console'
import fs from 'fs'
import webpack from 'webpack'
import _ from 'lodash'
import bridge from '../bridge'
import cache from '../cache'
import exec from '../lib/exec'
import log from '../lib/log'
import { touch, p, mkdir, rmdir,
        readFile, writeFile,
        writeJSON, readJSON } from '../lib/fns'

let WHERE = {}
let OPTS
let INSTALLING = false
let FIRST_RUN = true

/*

  Public:
   - init: set options
   - install: checks all imports (cache + package.json.installed) and bundles
   - scanFile: checks for imports in file and installs/caches

  Private:
   - bundle: write cache/installed + pack
     - pack: deps.js => packages.js (bundle)
   - setInstalled: cache => package.json.installed
   - writeDeps: deps => deps.js

*/

function init(_opts) {
  OPTS = _opts

  WHERE.outDir = p(OPTS.flintDir, 'deps')
  WHERE.depsJS = p(WHERE.outDir, 'deps.js')
  WHERE.depsJSON = p(WHERE.outDir, 'deps.json')
  WHERE.packagesJS = p(WHERE.outDir, 'packages.js')
  WHERE.packageJSON = p(OPTS.flintDir, 'package.json')
}

function mkDir(redo) {
  return new Promise(async (res, rej) => {
    try {
      if (redo) {
        await rmdir(WHERE.depsJSON)
      }

      await mkdir(WHERE.outDir)
      await* [
        touch(WHERE.depsJSON),
        touch(WHERE.depsJS),
        touch(WHERE.packagesJS)
      ]

      res()
    }
    catch(e) {
      console.error(e)
      rej(e)
    }
  })
}

const onPackageStart = (name) => {
  if (OPTS.build) return
  bridge.message('package:install', { name })
}

const onPackageError = (name, error) => {
  if (OPTS.build) return
  bridge.message('package:error', { name, error })
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
  'react-dom'
]

const rmExternals = ls => ls.filter(i => externals.indexOf(i) < 0)

/*

  ensures all packages both in files and in package.json.installed
  are written out to the bundled js file

*/
async function install(force) {
  log('npm: install')
  return new Promise(async (resolve, reject) => {
    try {
      // ensure deps dir
      await mkDir(force)

      // write out to package.installed
      const allInstalled = await setInstalled()
      log('npm: install: allInstalled:', allInstalled)

      // remove externals
      const installed = rmExternals(allInstalled)

      // written = packages already written out to js bundle
      let written = []
      try {
        const installed = await readJSON(WHERE.depsJSON)
        written = rmExternals(installed.deps)
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
          try {
            await save(dep, un.indexOf(dep), un.length)
          }
          catch(e) {
            console.log('Failed to install', dep)
          }
        }

        await bundle()
      }

      resolve(installed)
      onPackagesInstalled()
      FIRST_RUN = false
    } catch(e) {
      console.error('install', e)
      reject(e)
    }
  })
}

// => deps.json
// => deps.js
const depRequireString = name => `
  try {
    window.__flintPackages["${name}"] = require("${name}")
  }
  catch(e) {
    console.log('Error running package!')
    console.error(e)
  };
`

// package.json.installed => deps.js
async function writeDeps(deps = []) {
  return new Promise(async (resolve) => {
    log('npm: writeDeps:', deps)
    await writeJSON(WHERE.depsJSON, { deps })
    const requireString = deps.map(depRequireString).join('')
    await writeFile(WHERE.depsJS, requireString)
    resolve()
  })
}

// allInstalled() => pack()
function bundle() {
  log('npm: bundle')
  return new Promise(async (res, rej) => {
    try {
      const installed = await getInstalled()
      await writeDeps(installed)
      await pack()
      res()
    }
    catch(e) {
      console.error('bundle()', e)
    }
  })
}

function getInstalled() {
  return new Promise(async (resolve, reject) => {
    try {
      const fileImports = cache.getImports()
      const pkg = await readJSON(WHERE.packageJSON)

      const all = _.union(pkg.installed, fileImports)
        .filter(x => typeof x == 'string')

      log('npm: getInstalled: all:', all)
      resolve(all)
    }
    catch(e) {
      console.error(e)
      reject(e)
    }
  })
}

// all found installs => package.json.installed
function setInstalled() {
  log('npm: setInstalled')
  return new Promise(async (resolve, reject) => {
    try {
      await afterScans()

      const pkg = await readJSON(WHERE.packageJSON)
      const all = await getInstalled()

      pkg.installed = all

      await writeJSON(WHERE.packageJSON, pkg, {spaces: 2})
      resolve(pkg.installed)
    }
    catch(e) {
      console.error(e)
      reject(e)
    }
  })
}

// webpack
// deps.js => packages.js
async function pack(file, out) {
  log('npm: pack')
  return new Promise((resolve, reject) => {
    webpack({
      entry: WHERE.depsJS,
      externals: { react: 'React', bluebird: '_bluebird' },
      output: { filename: WHERE.packagesJS },
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

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

// <= file, source
//  > install new deps
// => update cache
async function scanFile(file, source) {
  try {
    const all = await getInstalled()
    const found = findRequires(source)
    const fresh = found.filter(f => all.indexOf(f) < 0)

    log('scanFile: Found packages in file:', found)
    log('scanFile: New packages:', fresh)

    // no new ones found
    if (!fresh.length) return

    const already = found.filter(f => all.indexOf(f) >= 0)

    let installed = []
    let installing = fresh

    INSTALLING = true

    // install deps one by one
    const installNext = async () => {
      const dep = installing.shift()
      log('scanFile: start install:', dep)
      onPackageStart(dep)

      try {
        await save(dep)
        log('scanFile: package installed', dep)
        installed.push(dep)
        onPackageFinish(dep)
        next()
      } catch(e) {
        log('scanFile: package install failed', dep)
        onPackageError(dep, error)
        next()
      }
    }

    // loop
    const next = () => {
      log('scanFile: installing.length', installing.length)
      if (installing.length) return installNext()
      done()
    }

    const done = async () => {
      try {
        // cache newly installed + already
        cache.setFileImports(file, installed.concat(already))
        logInstalled(installed)
        afterScansClear()

        if (!FIRST_RUN) {
          log('npm: scanFile', '!firstrun, bundle()')
          await bundle()
          onPackagesInstalled()
        }
      }
      catch(e) {
        console.error('scanFile: error: done():', e)
      }
    }

    installNext()
  }
  catch (e) {
    console.log('Error installing dependency!')
    console.log(e)
    console.log(e.message)
  }
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
    exec('npm install --save ' + name, OPTS.flintDir, err => {
      if (spinner) spinner.stop()
      if (err) rej('Install failed for package ' + name)
      else res(name)
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