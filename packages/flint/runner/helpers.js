import TransformPlugin from './transform'
import opts from './opts'

export const transformPlugin = new TransformPlugin()

export function isProduction() {
  return opts('build')
}

export function getBabelConfig(config) {
  return {
    breakConfig: true, // avoid reading .babelrc
    jsxPragma: 'view.el',
    stage: 1,
    blacklist: ['es6.tailCall', 'strict'],
    retainLines: opts('config').pretty ? false : true,
    comments: true,
    optional: ['regenerator', 'runtime'],
    plugins: [transformPlugin.get(config)],
    extra: { production: isProduction() }
  }
}
