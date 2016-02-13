import { install, installAll, isInstalling, finishedInstalling, willInstall } from './install'
import { uninstall } from './uninstall'
import { scanFile } from './scanFile'
import { internals } from './internals'
import { externals } from './externals'
import remakeInstallDir from './lib/remakeInstallDir'

async function init() {
  await remakeInstallDir()
}

async function all(opts) {
  await internals(opts)
  await externals({ doInstall: true, ...opts })
  await uninstall()
}

export default {
  init,
  all,
  install,
  installAll,
  uninstall,
  scanFile,
  externals,
  internals,
  isInstalling,
  finishedInstalling,
  remakeInstallDir,
  willInstall
}