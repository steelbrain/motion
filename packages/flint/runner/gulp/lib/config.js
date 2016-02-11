import FlintTransform from 'flint-transform'
import { isProduction } from './helpers'
import opts from '../../opts'
import deepmerge from 'deepmerge'

export function file(config) {
  return getBabelConfig({
    plugins: [
      FlintTransform.file({
        basePath: opts('appDir'),
        production: isProduction(),
        selectorPrefix: opts('config').selectorPrefix || '#_flintapp ',
        routing: opts('config').routing,
        ...config
      })
    ]
  })
}

export function app() {
  return {
    whitelist: [],
    retainLines: true,
    comments: true,
    plugins: [FlintTransform.app({ name: opts('saneName') })],
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