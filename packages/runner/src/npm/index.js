import { Promise } from 'bluebird'
import { Spinner } from '../lib/console'
import fs from 'fs'
import webpack from 'webpack'
import _ from 'lodash'
import bridge from '../bridge'
import cache from '../cache'
import exec from '../lib/exec'
import log from '../lib/log'
import {
  touch, p, mkdir,
  readFile, writeFile,
  writeJSON, readJSON } from '../lib/fns'

let WHERE = {}
let OPTS

async function init(_opts) {
  OPTS = _opts

  WHERE.outDir = p(OPTS.flintDir, 'deps')
  WHERE.depsJS = p(WHERE.outDir, 'deps.js')
  WHERE.depsJSON = p(WHERE.outDir, 'deps.json')
  WHERE.packagesJS = p(WHERE.outDir, 'packages.js')
  WHERE.packageJSON = p(OPTS.flintDir, 'package.json')

  try {
    await readDeps()
  }
  catch(e) { console.error(e) }
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

// <= deps.json
// <= package.json
async function readDeps() {
  log('npm: readDeps')
  return new Promise(async (resolve, reject) => {
    try {
      // ensure setup
      await mkdir(WHERE.outDir)
      await touch(WHERE.depsJSON)

      // package.json
      const _package = await readJSON(WHERE.packageJSON)
      const packages = rmExternals(Object.keys(_package.dependencies))

      // read deps.json
      let deps = []
      try {
        const installed = await readJSON(WHERE.depsJSON)
        deps = rmExternals(installed.deps)
      }
      catch(e) {
        log('npm: readDeps: no deps installed')
      }

      // install uninstalled
      const un = _.difference(packages, deps)
      log('npm: readDeps: un: ', un)
      if (un.length) {
        console.log(`Installing Packages...`.white.bold)

        for (let dep of un) {
          try {
            await save(dep, un.indexOf(dep), un.length)
          }
          catch(e) {
            console.log('Failed to install', dep)
          }
        }

        await writeDeps(packages)
        await pack()
      }

      const allDeps = _.union(deps, packages)
      log('npm: readDeps: allDeps', allDeps)
      cache.setImports(allDeps)
      resolve(allDeps)
      onPackagesInstalled()
    } catch(e) {
      console.log('readDeps', e)
      reject(e)
    }
  })
}

// => deps.json
// => deps.js
const depRequireString = name => `window.__flintPackages["${name}"] = require("${name}");`
async function writeDeps(deps = []) {
  log('npm: writeDeps')
  return new Promise(async (resolve) => {
    const requireString = deps.map(depRequireString).join("\n")
    log('npm: writeDeps:', deps)
    await writeFile(WHERE.depsJS, requireString)
    await writeJSON(WHERE.depsJSON, { deps })
    resolve()
  })
}

// package.json => packages.js
function bundle() {
  log('npm: bundle')
  return new Promise(async (res, rej) => {
    try {
      const deps = await readDeps()
      await writeDeps(deps)
      await pack()
      res()
    }
    catch(e) { console.error(e) }
  })
}

// webpack
// deps.js => packages.js
async function pack(file, out) {
  log('npm: pack')
  return new Promise((res, rej) => {
    webpack({
      entry: WHERE.depsJS,
      externals: { react: 'React', bluebird: '_bluebird' },
      output: { filename: WHERE.packagesJS },
      devtool: 'source-map'
    }, err => {
      if (err) {
        console.log("Error bundling your packages:", err)
        return rej(err)
      }

      log('npm: pack: finished')
      res()
    })
  })
}

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

// <= file, source
//  > install new deps
// => update cache
function scanFile(file, source) {
  try {
    const all = cache.getImports()
    const found = findRequires(source)
    const fresh = found.filter(f => all.indexOf(f) < 0)

    log('scanFile: Found packages in file:', found)
    log('scanFile: New packages:', fresh)

    // no new ones found
    if (!fresh.length) return

    const already = found.filter(f => all.indexOf(f) >= 0)

    let installed = []
    let installing = fresh

    // install deps one by one
    const installNext = async () => {
      const dep = installing.shift()
      log('scanFile: Start install:', dep)
      onPackageStart(dep)

      try {
        await save(dep)
        log('scanFile: package installed', dep)
        installed.push(dep)
        await bundle()
        onPackageFinish(dep)
        onPackagesInstalled()
        next()
      } catch(e) {
        log('scanFile: package install failed', dep)
        onPackageError(dep, error)
        next()
      }
    }

    // loop
    const next = () => {
      if (installing.length) return installNext()
      done()
    }

    const done = () => {
      // cache newly installed + already
      cache.setFileImports(file, installed.concat(already))
      logInstalled(installed)
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
  const spinner = new Spinner(` ${index} of ${total}: ${name}`)
  spinner.start({ fps: 30 })

  log('npm: save:', name)
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, OPTS.flintDir, err => {
      spinner.stop()
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm install
function install(dir) {
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

export default {
  init, save, bundle, install, scanFile
}
