async function init() {
  await remakeInstallDir()
}

export default { init, install, scanFile, bundleInternals, removeOld, isInstalling, finishedInstalling, remakeInstallDir }