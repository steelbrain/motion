import { install, isInstalling, finishedInstalling } from './install'
import { uninstall } from './uninstall'
import { scanFile } from './scanFile'
import { bundleInternals } from './internals'
import { bundleExternals } from './externals'
import remakeInstallDir from './lib/remakeInstallDir'

async function init() {
  await remakeInstallDir()
}

export default {
  init,
  install,
  uninstall,
  scanFile,
  externals: bundleExternals,
  internals: bundleInternals,
  isInstalling,
  finishedInstalling,
  remakeInstallDir
}