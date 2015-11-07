import bridge from './bridge'
import opts from '../opts'

// messaging

export function onStart(name) {
  if (opts.get('build')) return
  bridge.message('package:install', { name })
}

export function onError(name, error) {
  if (opts.get('build')) return
  bridge.message('package:error', { name, error })
  bridge.message('npm:error', { error })
}

export function onFinish(name) {
  if (opts.get('build')) return
  log('runner: onPackageFinish: ', name)
  bridge.message('package:installed', { name })
}

export function onInstalled() {
  if (opts.get('build')) return
  bridge.message('packages:reload', {})
}