import cache from '../cache'
import opts from '../opts'
import { readPackageJSON, readInstalled } from './lib/readInstalled'
import normalize from './lib/normalize'
import { externals } from './externals'
import npm from './lib/npm'
import writeInstalled from './lib/writeInstalled'
import filterWithPath from './lib/filterWithPath'
import { rm, p, _, log, handleError } from '../lib/fns'

const LOG = 'externals'

export async function uninstall(rebundle) {
  try {
    if (!opts('hasRunInitialBuild')) return

    // get installed
    const installed = await readInstalled()

    // get imported
    const importedPaths = cache.getExternals()
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
        await npm.unsave(dep, toUninstall.indexOf(dep), toUninstall.length)
        console.log(`  ✘ ${dep}`.red)
        return dep
      }
      catch(e) {
        handleError(e)
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
      await externals()
    }

    return uninstalled
  }
  catch(e) {
    handleError(e)
  }
}