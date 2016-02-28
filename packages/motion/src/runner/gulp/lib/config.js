import MotionTransform from 'motion-transform'
import { isProduction } from './helpers'
import opts from '../../opts'
import onMeta from './onMeta'
import extend from 'deep-extend'
import { _, p, log } from '../../lib/fns'
import writeStyle from '../../lib/writeStyle'

const id = () => {}
let hasSetupAfterRun = false
let plugin = null
let onFinishCb = null

function babelConfig() {
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'Motion.createElement',
    stage: 0,
    blacklist: ['es6.tailCall'],
    retainLines: opts('config').pretty ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    extra: {
      production: isProduction()
    },
    ...(opts('config').babel || {})
  }
}

export function file(onFinish) {
  let config = babelConfig()

  config.plugins = config.plugins || []
  config.plugins.push(motionFilePlugin(onFinish))

  return config
}

function motionFilePlugin(onFinish) {
  // update info cb per-call
  onFinishCb = onFinish

  // only instantiate plugin as needed

  // on init
  plugin = plugin || MotionTransform.file({
    ...fileConf(),
    firstRun: true,
    onFinish: _ => onFinishCb(_)
  })

  // on watch (hot reloads)
  if (opts('hasRunInitialBuild') && !hasSetupAfterRun) {
    hasSetupAfterRun = true
    plugin = MotionTransform.file({
      ...fileConf(),
      firstRun: false,
      onFinish: _ => onFinishCb(_)
    })
  }

  return plugin
}

function fileConf() {
  return {
    basePath: opts('appDir'),
    production: isProduction(),
    selectorPrefix: opts('config').selectorPrefix || '#_motionapp ',
    routing: opts('config').routing,
    entry: p(opts('appDir'), opts('config').entry),
    log,
    onMeta,
    writeStyle
  }
}

export function app() {
  return {
    whitelist: [],
    retainLines: true,
    comments: true,
    plugins: [MotionTransform.app({ name: opts('saneName') })],
    compact: true,
    extra: { production: isProduction() }
  }
}

export default {
  app,
  file
}
