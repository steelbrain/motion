import _ from 'lodash'
import cache from '../cache'
import readInstalled from './lib/readInstalled'
import normalize from './lib/normalize'
import { bundleExternals } from './externals'
import { unsave } from './lib/npm'
import writeInstalled from './lib/writeInstalled'
import { log, handleError } from '../lib/fns'

const filterFalse = ls => ls.filter(l => !!l)

export async function uninstall(rebundle) {
  try {
    const installed = await readInstalled()
    const imported = cache.getImports()
    const _installed = normalize(installed)
    const _imported = normalize(imported)
    const toUninstall = _.difference(_installed, _imported)
    log('externals', 'uninstall: _installed', _installed, '_imported', _imported, 'toUninstall', toUninstall)

    if (!toUninstall.length) {
      // ensure we overwrite any bad deps.json
      await writeInstalled(_installed)
      return
    }

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
    const final = normalize(_.difference(installed, success))
    log('externals', 'success', success, 'final', final)
    await writeInstalled(final)

    if (rebundle) {
      await bundleExternals()
    }

    return success
  }
  catch(e) {
    handleError(e)
  }
}