import cache from '../cache'
import exec from '../lib/exec'
import handleError from '../lib/handleError'
import fs from 'fs'
import log from '../lib/log'

import { Promise } from 'bluebird'
Promise.longStackTraces(true)

const readFile = Promise.promisify(fs.readFile)
const getMatches = (string, regex, index) => {
  index || (index = 1); // default to the first capturing group
  var matches = [];
  var match;
  while (match = regex.exec(string)) {
    matches.push(match[index]);
  }
  return matches;
}


// deps cache
let installing = false
let newDeps = []
let installedDeps = []

export function checkDependencies(file, source, { dir, onPackageStart, onPackageFinish, onPackageError }) {
  try {
    const found = getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []

    cache.setImports(file, found)

    const fresh = found.filter(x => installedDeps.indexOf(x) < 0)
    log('Found packages in file:', found)
    log('New packages:', fresh)

    // no new ones found
    if (!fresh.length) return

    // add new ones to queue
    newDeps = newDeps.concat(fresh)

    // we've queued and may already be installing, hold off
    if (installing) return

    // install deps one by one
    const installNextDep = async () => {
      const dep = newDeps.shift()
      onPackageStart(dep)

      try {
        await save(dep, dir)
        log('package installed', dep)
        installedDeps.push(dep)
        onPackageFinish(dep)
        next()
      } catch(e) {
        onPackageError(err)
        next()
      }
    }

    // continue installing
    const next = () => {
      if (newDeps.length)
        installNextDep()
      else
        installing = false
    }

    installing = true
    installNextDep()
  }
  catch (e) {
    console.log('Error installing dependencies!')
    console.log(e)
    console.log(e.message)
  }
}

export function getPackageDeps(dir) {
  log('getPackageDeps', dir)
  return readFile(dir + '/package.json')
    .then(data => {
      const deps = Object.keys(JSON.parse(data).dependencies)
      log('getPackageDeps:', deps)
      installedDeps = deps
      return deps
    })
}

// npm install --save 'name'
export function save(name, dir) {
  return new Promise((res, rej) => {
    exec('npm install --save ' + name, dir, err => {
      if (err) rej('Install failed for package ' + name)
      else res(name)
    })
  })
}

// npm view => [versions]
// import npmview from 'npmview'
export function versions(name) {
  return new Promise((res, rej) => {
    npmview(name, (err, version, info) => {
      if (err) rej(err)
      else {
        let versions = info.versions.reverse().slice(10)
        const total = versions.length

        if (!total) return res(null)

        // get detailed info for last three
        Promise.all(
          versions.slice(3).map(v => new Promise((res, rej) =>
            npmview(`${name}@${v}`, (err, v, { description, homepage }) => {
              if (err) return rej(err)
              res({ description, homepage })
            })
          ))
        ).then(infos => {
          // add info onto versions
          versions = versions
            .map((v, i) => ({ version: v, ...(infos[i] || {}) }))

          res(versions)
        })
      }
    })
  })
}

// npm install
export function install(dir) {
  return new Promise((res, rej) => {
    exec('npm install', dir, err => {
      if (err) rej(err)
      else res()
    })
  })
}

export default {
  save, versions, install, getPackageDeps, checkDependencies
}