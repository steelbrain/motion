import bridge from '../../bridge'
import opts from '../../opts'
import cache from '../../cache'
import log from '../../lib/log'

// messaging

function avoid() {
  if (opts('build') && !opts('watch'))
    return true

  return (
    !opts('hasRunInitialInstall') ||
    !opts('hasRunInitialBuild')
  )
}

export function onStart(name) {
  if (avoid()) return
  bridge.broadcast('package:install', { name })
}

export function onError(name, error) {
  if (avoid()) return
  bridge.broadcast('package:error', { name, error })
  bridge.broadcast('npm:error', { error })
}

export function onFinish(name) {
  if (avoid()) return
  log('bundler', 'onPackageFinish: ', name)
  bridge.broadcast('package:installed', { name })
}

export function onInstalled() {
  if (avoid()) return
  bridge.broadcast('packages:reload', {})
}

export function onInternalInstalled() {
  if (avoid()) return
  bridge.broadcast('internals:reload', {
    importers: cache.getInternalImporters()
  })
}
