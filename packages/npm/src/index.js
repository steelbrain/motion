'use strict'

/* @flow */

import Path from 'path'
import invariant from 'assert'
import { exists, readJSON, handleError, rm } from 'motion-fs-extra-plus'
import { exec } from 'sb-exec'
import semver from 'semver'
import { versionFromRange } from './helpers'

type Install$Options = {
  rootDirectory: string,
  filter: Function
}

class Installer {
  options: Install$Options;

  constructor({rootDirectory, filter}: Install$Options) {
    invariant(typeof rootDirectory === 'string', 'rootDirectory must be a string')
    invariant(!filter || typeof filter === 'function', 'filter must be a function')

    this.options = { rootDirectory, filter }
  }
  async install(name: string): Promise<void> {
    await exec('npm', ['install', '--save', name], { cwd: this.options.rootDirectory })
  }
  async uninstall(name: string): Promise<void> {
    await exec('npm', ['uninstall', '--save', name], { cwd: this.options.rootDirectory })
  }
  async installPeerDependencies(
    name: string,
    onStarted?: ((packages: Array<Array<string>>) => void),
    onProgress?: ((packageName: string, error: ?Error) => void),
    onComplete?: (() => void)
  ): Promise<void> {
    const rootDirectory = this.options.rootDirectory
    const manifestPath = Installer.manifestPath(rootDirectory, name)
    const manifestContents = await readJSON(manifestPath)
    const peerDependencies = manifestContents && manifestContents.peerDependencies || {}

    if (peerDependencies && typeof peerDependencies === 'object') {
      let dependencies = Object.keys(peerDependencies)
      if (this.options.validate) {
        dependencies = this.options.filter(dependencies)
      }
      const versions = dependencies.map(function(name) {
        const range = peerDependencies[name]
        const version = semver.maxSatisfying(versionFromRange(range), range)
        return [name, version]
      })

      if (onStarted) {
        onStarted(versions)
      }

      await Promise.all(versions.map(async function([name, version]) {
        try {
          await exec('npm', ['install', `${name}@${version}`], { cwd: rootDirectory })
          if (onProgress) {
            onProgress(name, null)
          }
        } catch (_) {
          if (onProgress) {
            onProgress(name, _)
          } else throw _
        }
      }))

      if (onComplete) {
        onComplete()
      }
    }
  }
  static async manifestPath(rootDirectory: string, name: string): Promise<string> {
    // $PROJECT_PATH/node_modules/$NAME/package.json
    let manifestPath = Path.join(rootDirectory, 'node_modules', name, 'package.json')
    if (!await exists(manifestPath)) {
      // $PROJECT_PATH/../node_modules/$NAME/package.json
      manifestPath = Path.normalize(Path.join(rootDirectory, '..', 'node_modules', name, 'package.json'))
    }
    if (!await exists(manifestPath)) {
      throw new Error(`Unable to determine package installation path for ${name}`)
    }
    return manifestPath
  }
}

module.exports = Installer
