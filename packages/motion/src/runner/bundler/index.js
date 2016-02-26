import opts from '../opts'
import { install, installAll, isInstalling, finishedInstalling } from './install'
import { uninstall } from './uninstall'
import { scanFile } from './scanFile'
import { runInternals, writeInternals } from './internals'
import { runExternals, writeExternals } from './externals'
import remakeInstallDir from './lib/remakeInstallDir'

async function init() {
  await remakeInstallDir()
}

async function webpack() {
  await Promise.all([
    runExternals(),
    runInternals()
  ])
}

// webpack either watches or just runs once
async function all() {
  await installAll()
  await writeInternals({ force: true })
  await uninstall()
  await webpack()
}

export default {
  init,
  all,
  webpack,
  install,
  installAll,
  uninstall,
  scanFile,
  writeExternals,
  writeInternals,
  isInstalling,
  finishedInstalling,
  remakeInstallDir
}