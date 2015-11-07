import { install, isInstalling, finishedInstalling } from './install'
import { uninstall } from './uninstall'
import { scanFile } from './scanFile'
import { bundleInternals } from './internals'
import remakeInstallDir from './lib/remakeInstallDir'

async function init() {
  await remakeInstallDir()
}

export default {
  init,
  install,
  uninstall,
  scanFile,
  bundleInternals,
  isInstalling,
  finishedInstalling,
  remakeInstallDir
}