import cache from '../cache'
import readInstalled from './lib/readInstalled'
import normalize from './lib/normalize'
import { bundleExternals } from './externals'
import { unsave } from './lib/npm'
import writeInstalled from './lib/writeInstalled'
import readFullPaths from './lib/readFullPaths'
import filterExternalsWithPath from './lib/filterExternalsWithPath'
import { _, log, handleError } from '../lib/fns'

const LOG = 'externals'

export async function uninstall(rebundle) {
  try {
    // get full paths
    const installed = await readFullPaths()
    const imported = cache.getImports()

    // difference, uniq
    const toUninstallPaths = _.difference(installed, imported)
    const toUninstall = normalize(toUninstallPaths)

    log(LOG, 'uninstall',
      'installed', installed,
      'imported', imported,
      'toUninstallPaths', toUninstallPaths,
      'toUninstall', toUninstall,
    )

    if (!toUninstall.length)
      return

    console.log(`\n  Uninstalling...`.bold)

    // do uninstalls
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

    const uninstalled = attempted.filter(l => !!l)

    log('externals', 'uninstalled', uninstalled, 'final', final)

    // if uninstalled stuff, write
    if (uninstalled.length) {
      const nowInstalled = _.difference(toUninstall, uninstalled)
      const nowInstalledPaths = filterExternalsWithPath(toUninstall, nowInstalled)
      log(LOG, 'uninstall', 'nowInstalled', nowInstalled, 'nowInstalledPaths', nowInstalledPaths)
      await writeInstalled(nowInstalledPaths)
    }

    // if asked to rebundle or uninstalled, rebundle
    if (rebundle || uninstalled.length) {
      await bundleExternals()
    }

    return uninstalled
  }
  catch(e) {
    handleError(e)
  }
}