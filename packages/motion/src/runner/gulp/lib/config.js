import MotionTransform from 'motion-transform'
import { isProduction } from './helpers'
import opts from '../../opts'
import onMeta from './onMeta'
import extend from 'deep-extend'
import { _, p, log } from '../../lib/fns'
import writeStyle from '../../lib/writeStyle'

const id = () => {}
let isRunning = false
let plugin = null
let onInfoCb = null

export function file(onInfo) {
  const plugin = getPlugin(onInfo)
  const config = babelConf({ plugins: [plugin] })
  return config
}

function getPlugin(onInfo) {
  // update info cb per-call
  onInfoCb = onInfo

  // dont update plugin per-call (once on startup, once after initial build)
  if (!plugin || !isRunning) {
    if (opts('hasRunInitialBuild')) isRunning = true

    const conf = fileConf({
      firstRun: !isRunning,
      onInfo
    })

    // cached
    plugin = MotionTransform.file(conf)
  }

  return plugin
}

function fileConf({ firstRun, onInfo = id }) {
  const onFinish = info => {
    onInfo(info)
  }

  return {
    basePath: opts('appDir'),
    production: isProduction(),
    selectorPrefix: opts('config').selectorPrefix || '#_motionapp ',
    routing: opts('config').routing,
    entry: p(opts('appDir'), opts('config').entry),
    log,
    onMeta,
    writeStyle,
    onFinish,
    firstRun
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

export function babelConf({ plugins }) {
  const config = {
    plugins,
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'Motion.createElement',
    stage: 0,
    blacklist: ['es6.tailCall'],
    retainLines: opts('config').pretty ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    extra: {
      production: isProduction()
    }
  }

  const userConf = opts('config').babel

  if (userConf)
    return extend(config, userConf)
  else
    return config
}


export default {
  app,
  file
}
