import { Promise } from 'bluebird'
import fs from 'fs'
import webpack from 'webpack'
import _ from 'lodash'

import cache from '../cache'
import exec from '../lib/exec'
import log from '../lib/log'
import {
  p,
  mkdir,
  readFile,
  writeFile,
  writeJSON,
  readJSON,
  touch } from '../lib/fns'

let OPTS

async function init(_opts) {
  OPTS = _opts
  OPTS.outDir = p(OPTS.dir, 'deps')
  OPTS.depsJS = p(OPTS.outDir, 'deps.js')
  OPTS.depsJSON = p(OPTS.outDir, 'deps.json')
  OPTS.packagesJS = p(OPTS.outDir, 'packages.js')
  OPTS.packageJSON = p(OPTS.dir, 'package.json')
  log('npm: init opts: ', OPTS)

  try {
    await readDeps()
  }
  catch(e) { console.error(e) }
}

const externals = ['flint-js', 'react']
const rmExternals = ls => ls.filter(i => externals.indexOf(i) < 0)

// <= deps.json
// <= package.json
async function readDeps() {
  log('npm: readDeps')
  return new Promise(async (resolve, reject) => {
    try {
      // ensure setup
      await mkdir(OPTS.outDir)
      await touch(OPTS.depsJSON)

      // package.json
      const pkg = await readJSON(OPTS.packageJSON)
      const packages = rmExternals(Object.keys(pkg.dependencies))

      // deps.json
      let deps = []
      try {
        const installed = await readJSON(OPTS.depsJSON)
        deps = rmExternals(installed.deps)
      }
      catch(e) { log('no deps installed') }

      // install as necessary
      const uninstalled = _.difference(packages, deps)
      log('uninstalled: ', uninstalled)
      if (uninstalled.length) {
        uninstalled.forEach(async dep => {
          await save(dep)
        })

        await writeDeps(packages)
        await pack()
      }

      const allDeps = _.union(deps, packages)
      cache.setImports(allDeps)
      resolve(allDeps)
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
    await writeFile(OPTS.depsJS, requireString)
    await writeJSON(OPTS.depsJSON, { deps })
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
      entry: OPTS.depsJS,
      externals: { react: 'React', bluebird: '_bluebird' },
      output: { filename: OPTS.packagesJS },
      devtool: 'source-map'
    }, err => {
      if (err) return rej(err)
      res()
    })
  })
}

const findRequires = source =>
  getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

// <= file, source
//  > install new deps
// => update cache
function scanFile(file, source, opts) {
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
      opts.onPackageStart(dep)

      try {
        await save(dep)
        log('scanFile: package installed', dep)
        installed.push(dep)
        await bundle()
        opts.onPackageFinish(dep)
        next()
      } catch(e) {
        log('scanFile: package install failed', dep)
        opts.onPackageError(dep, error)
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
function save(name) {
  log('npm: save:', name)
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, OPTS.dir, err => {
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm install
function install(dir) {
  return new Promise((res, rej) => {
    exec('npm install', dir || OPTS.dir, err => {
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