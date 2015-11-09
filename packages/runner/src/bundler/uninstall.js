import _ from 'lodash'
import cache from '../cache'
import readInstalled from './lib/readInstalled'
import normalize from './lib/normalize'
import { bundleExternals } from './externals'
import { unsave } from './lib/npm'
import writeInstalled from './lib/writeInstalled'
import log from '../lib/log'

const filterFalse = ls => ls.filter(l => !!l)

export async function uninstall(rebundle) {
  const installed = await readInstalled()
  const imported = cache.getImports()
  const toUninstall = _.difference(normalize(installed), normalize(imported))
  log('npm: uninstall() toUninstall', toUninstall)

  if (!toUninstall.length) return

  console.log(`\n  Uninstalling...`.bold)
  const attempted = await* toUninstall.map(async dep => {
    try {
      await unsave(dep, toUninstall.indexOf(dep), toUninstall.length)
      console.log(`  ✘ ${dep}`.red)
      return dep
    }
    catch(e) {
      console.log('Failed to uninstall', dep)
      return false
    }
  })

  const success = filterFalse(attempted)
  const final = _.difference(installed, success)
  log('writing from uninstall()', final)
  await writeInstalled(final)

  if (rebundle) {
    await bundleExternals()
  }

  return success
}