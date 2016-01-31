'use babel'

import TransformPlugin from './transform'
import getOption from './opts'

export const transformPlugin = new TransformPlugin()

export function isProduction() {
  return getOption('build')
}

export function getBabelConfig(config) {
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: getOption('pretty') ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [transformPlugin.get(config)],
    extra: { production: isProduction() }
  }
}
