import { install, installAll, isInstalling, finishedInstalling } from './install'
import { uninstall } from './uninstall'
import { scanFile } from './scanFile'
import { bundleInternals } from './internals'
import { bundleExternals } from './externals'
import remakeInstallDir from './lib/remakeInstallDir'

async function init() {
  await remakeInstallDir()
}

async function all() {
  await bundleInternals()
  await bundleExternals({ doInstall: true })
  await uninstall()
}

export default {
  init,
  all,
  install,
  installAll,
  uninstall,
  scanFile,
  externals: bundleExternals,
  internals: bundleInternals,
  isInstalling,
  finishedInstalling,
  remakeInstallDir
}