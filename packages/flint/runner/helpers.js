import FlintTransform from 'flint-transform'
import { isProduction } from './gulp/lib/helpers'
import opts from './opts'
import deepmerge from 'deepmerge'

export function getBabelConfig(flintConfig) {
  const flintPlugin = FlintTransform.file(Object.assign({
    basePath: opts('appDir'),
    production: isProduction(),
    selectorPrefix: opts('config').selectorPrefix || '#_flintapp ',
    routing: opts('config').routing
  }, flintConfig))

  const babelConf = {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: opts('config').pretty ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [flintPlugin],
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
