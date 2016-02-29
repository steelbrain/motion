import disk from '../../disk'
import opts from '../../opts'
import { p, readJSON, handleError, rm } from 'motion-fs-extra-plus'
import exec from 'sb-exec'
import normalize from './normalize'
import progress from './progress'
import semver from 'semver'

// npm install --save 'name'
// npm 3 we need to install peerDependencies as well
export async function save(name, index, total) {
  await progress('Installing', `npm install --save ${name}`, name, index, total)
  await installPeerDeps(name)
}

// npm uninstall --save 'name'
export async function unsave(name, index, total) {
  try {
    await progress('Uninstalling', 'npm uninstall --save ' + name, name, index, total)
  }
  catch(e) {
    // manual uninstall
    await rm(p(opts('modulesDir'), name))
    await disk.packageJSON.write((current, write) => {
      delete current.dependencies[name]
      write(current)
    })
  }
}

function splitVersions(range) {
  const found = range.match(/[0-9\.]+/g)
  return found.length ? found : range
}

function latestVersion(name, range) {
  try {
    return semver.maxSatisfying(splitVersions(range), range)
  }
  catch(e) {
    const simpleFindVer = range.replace(/[^0-9\. ]+/g, '').split(' ')[0]

    print(`  Error in semver of package ${name} ${e.message}`.yellow)
    print("  Attempting ", simpleFindVer)

    return simpleFindVer
  }
}

export async function installPeerDeps(name) {
  // instead of using npm view we just read package.json, safer
  const pkg = await readJSON(p(opts('motionDir'), 'node_modules', name, 'package.json'))
  const peers = pkg.peerDependencies

  // install peerdeps
  if (peers && typeof peers == 'object') {
    const peersArr = normalize(Object.keys(peers))

    if (peersArr.length) {
      print(`  Installing ${name} peerDependencies`.bold)

      const peersFull = peersArr.map(name => {
        const version = latestVersion(name, peers[name])

        if (!version)
          throw new Error(`No valid version range for package ${name}@${peers[name]}`)

        return `${name}@${version}`
      })

      await Promise.all(
        peersFull.map(full => execPromise(`npm install --save ${full}`, opts('motionDir')))
      )

      print('  ✓'.green, peersArr.join(', '))
      return peersArr
    }
  }
}

export default {
  save, unsave
}
