import cache from '../cache'
import opts from '../opts'
import readInstalled from './lib/readInstalled'
import normalize from './lib/normalize'
import { bundleExternals } from './externals'
import { unsave } from './lib/npm'
import writeInstalled from './lib/writeInstalled'
import filterWithPath from './lib/filterWithPath'
import { _, log, handleError } from '../lib/fns'

const LOG = 'externals'

export async function uninstall(rebundle) {
  try {
    if (!opts.get('hasRunInitialBuild')) return

    // get full paths
    const installed = await readInstalled()
    const importedPaths = cache.getImports()
    const imported = normalize(importedPaths)

    // difference, uniq
    const toUninstall = _.difference(installed, imported)

    log(LOG, 'uninstall',
      'installed', installed,
      'imported', imported,
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

    log('externals', 'uninstalled', uninstalled)

    // if uninstalled stuff, write
    if (uninstalled.length) {
      const nowInstalled = _.difference(imported, uninstalled)
      const nowInstalledPaths = filterWithPath(importedPaths, nowInstalled)
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