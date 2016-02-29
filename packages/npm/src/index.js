'use strict'

/* @flow */

import path from 'path'
import { readJSON, handleError, rm } from 'motion-fs-extra-plus'
import exec from 'sb-exec'
import semver from 'semver'

export default class Install {
  constructor(options) {
    this.options = {
      where: __dirname,
      filter: i => i,
      ...options
    }
  }

  async save(name) {
    await exec(`npm install --save ${name}`)
    await this.installPeerDeps(name)
  }

  // npm uninstall --save 'name'
  async unsave(name) {
    try {
      await exec(`npm uninstall --save ${name}`)
    }
    catch(e) {
      // manual uninstall
      await rm(path.join(this.options.where, name))


      // TODO need to write to packagejson to remove
      // await disk.packageJSON.write((current, write) => {
      //   delete current.dependencies[name]
      //   write(current)
      // })
    }
  }

  splitVersions(range) {
    const found = range.match(/[0-9\.]+/g)
    return found.length ? found : range
  }

  latestVersion(name, range) {
    try {
      return semver.maxSatisfying(this.splitVersions(range), range)
    }
    catch(e) {
      const simpleFindVer = range.replace(/[^0-9\. ]+/g, '').split(' ')[0]

      print(`  Error in semver of package ${name} ${e.message}`.yellow)
      print("  Attempting ", simpleFindVer)

      return simpleFindVer
    }
  }

  async installPeerDeps(name) {
    // instead of using npm view we just read package.json, safer
    const pkg = await readJSON(this.packagePath(name))
    const peers = pkg.peerDependencies

    // install peerdeps
    if (peers && typeof peers == 'object') {
      const peersArr = this.filter(Object.keys(peers))

      if (peersArr.length) {
        print(`  Installing ${name} peerDependencies`.bold)

        const peersFull = peersArr.map(name => {
          const version = latestVersion(name, peers[name])

          if (!version)
            throw new Error(`No valid version range for package ${name}@${peers[name]}`)

          return `${name}@${version}`
        })

        await Promise.all(
          peersFull.map(full =>
            exec(`npm install --save ${full}`, this.options.where)
          )
        )

        print('  ✓'.green, peersArr.join(', '))
        return peersArr
      }
    }
  }

  packagePath(name) {
    return path.join(this.options.where, name, 'package.json')
  }
}
