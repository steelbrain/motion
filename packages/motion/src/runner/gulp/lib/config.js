import MotionTransform from 'motion-transform'
import { isProduction } from './helpers'
import opts from '../../opts'
import onMeta from './onMeta'
import { p, log } from '../../lib/fns'
import writeStyle from '../../lib/writeStyle'
import deepmerge from 'deepmerge'

let motion = null
const id = () => {}

// allow these to change per-call
let _onImports, _onCold, _onExports
let onImports = _ => _onImports(_)
let onExports = _ => _onExports(_)
let onCold = _ => _onCold(_)

const getFileTransformer = (conf) => MotionTransform.file({
  basePath: opts('appDir'),
  production: isProduction(),
  selectorPrefix: opts('config').selectorPrefix || '#_motionapp ',
  routing: opts('config').routing,
  entry: p(opts('appDir'), opts('config').entry),
  log,
  onMeta,
  writeStyle,
  onImports: _ => onImports(_),
  onExports: _ => onExports(_),
  onCold: _ => onCold(_),
  ...conf
})

let switchedToRunning

export function file(config) {
  _onImports = config.onImports
  _onExports = config.onExports
  _onCold = config.onCold

  // only instantiate once
  if (!motion) {
    motion = getFileTransformer({ firstRun: true })
  }
  else if (!switchedToRunning && opts('hasRunInitialBuild')) {
    switchedToRunning = true
    motion = getFileTransformer({ firstRun: false })
  }

  return getBabelConfig({
    plugins: [motion]
  })
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

export function getBabelConfig({ plugins }) {
  const babelConf = {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 0,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: opts('config').pretty ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins,
    extra: {
      production: isProduction()
    },
  }

  const userConf = opts('config').babel

  if (userConf)
    return deepmerge(babelConf, userConf)
  else
    return babelConf
}

export default {
  app,
  file
}