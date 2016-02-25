import webpack from './webpack'
import disk from '../disk'
import opts from '../opts'
import cache from '../cache'
import requireString from './lib/requireString'
import { installAll } from './install'
import { onInstalled } from './lib/messages'
import { log, logError } from '../lib/fns'

// EXTERNALS
//    check updated
//      => write paths to disk
//      => pack with webpack
export async function writeExternals(opts = {}) {
  if (opts.force || disk.externalsPaths.hasChanged()) {
    const paths = await disk.externalsPaths.read()

    await disk.externalsIn.write((current, write) => {
      write(requireString(paths))
    })
  }
}

export function runExternals() {
  return webpack({
    name: 'externals',
    onFinish: onInstalled,
    config: {
      entry: opts('deps').externalsIn
    }
  })
}

export async function installExternals(filePath) {
  if (opts('hasRunInitialBuild'))
    await installAll(cache.getExternals(filePath))
}