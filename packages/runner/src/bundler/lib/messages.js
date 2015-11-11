import bridge from '../../bridge'
import opts from '../../opts'

// messaging

function avoid() {
  if (opts.get('build'))
    return true

  return (
    !opts.get('hasRunInitialInstall') ||
    !opts.get('hasRunInitialBuild')
  )
}

export function onStart(name) {
  if (avoid()) return
  bridge.message('package:install', { name })
}

export function onError(name, error) {
  if (avoid()) return
  bridge.message('package:error', { name, error })
  bridge.message('npm:error', { error })
}

export function onFinish(name) {
  if (avoid()) return
  log('bundler', 'onPackageFinish: ', name)
  bridge.message('package:installed', { name })
}

export function onInstalled() {
  if (avoid()) return
  bridge.message('packages:reload', {})
}

export function onInternalInstalled() {
  if (avoid()) return
  bridge.message('internals:reload', {})
}