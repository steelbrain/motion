import { install, installAll, isInstalling, finishedInstalling, willInstall } from './install'
import { uninstall } from './uninstall'
import { scanFile } from './scanFile'
import { runInternals, writeInternals } from './internals'
import { runExternals, writeExternals } from './externals'
import remakeInstallDir from './lib/remakeInstallDir'

async function init() {
  await remakeInstallDir()
}

async function all() {
  runExternals()
  runInternals()
  await installAll()
  await writeInternals({ force: true })
  await uninstall()
}

export default {
  init,
  all,
  install,
  installAll,
  uninstall,
  scanFile,
  writeExternals,
  writeInternals,
  isInstalling,
  finishedInstalling,
  remakeInstallDir,
  willInstall
}