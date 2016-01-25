import opts from '../../opts'
import { p, readJSON } from '../../lib/fns'
import execPromise from '../../lib/execPromise'
import normalize from './normalize'
import progress from './progress'

// npm install --save 'name'
export async function save(name, index, total) {
  await progress('Installing', `npm install --save ${name}`, name, index, total)
  // npm 3 we need to install peerDependencies as well
  await installPeerDeps(name)
}

// TODO: only do this if npm 3 `exec('npm -v').charAt(0) == 3`
async function installPeerDeps(name) {
  // instead of using npm view we just read package.json, safer
  const pkg = await readJSON(p(opts('flintDir'), 'node_modules', name, 'package.json'))
  const peers = pkg.peerDependencies

  // install peerdeps
  if (peers && typeof peers == 'object') {
    const peersArr = normalize(Object.keys(peers))

    if (peersArr.length) {
      console.log(`  Installing ${name} peerDependencies`.bold)
      const peersFull = peersArr.map(name => `${name}@${peers[name]}`)
      await* peersFull.map(full => execPromise(`npm install --save ${full}`, opts('flintDir')))
      console.log('  ✓'.green, peersArr.join(', '))
      return peersArr
    }
  }
}

// npm uninstall --save 'name'
export async function unsave(name, index, total) {
  await progress('Uninstalling', 'npm uninstall --save ' + name, name, index, total)
}

export default {
  save, unsave
}