import MotionTransform from 'motion-transform'
import { isProduction } from './helpers'
import opts from '../../opts'
import onMeta from './onMeta'
import { log } from '../../lib/fns'
import writeStyle from '../../lib/writeStyle'
import deepmerge from 'deepmerge'

let motion = null
const id = () => {}

// allow these to change per-call
let _onImports, _onExports
let onImports = _ => _onImports(_)
let onExports = _ => _onExports(_)

export function file(config) {
  _onImports = config.onImports
  _onExports = config.onExports

  // only instantiate once
  if (!motion) {
    const motionOpts = {
      basePath: opts('appDir'),
      production: isProduction(),
      selectorPrefix: opts('config').selectorPrefix || '#_motionapp ',
      routing: opts('config').routing,
      log,
      onMeta,
      writeStyle,
      onImports: _ => onImports(_),
      onExports: _ => onExports(_)
    }

    motion = MotionTransform.file(motionOpts)
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
    stage: 1,
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