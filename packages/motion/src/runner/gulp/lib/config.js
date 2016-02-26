import MotionTransform from 'motion-transform'
import { isProduction } from './helpers'
import opts from '../../opts'
import onMeta from './onMeta'
import { _, p, log } from '../../lib/fns'
import writeStyle from '../../lib/writeStyle'

const id = () => {}

export function file(onInfo) {
  const plugin = getPlugin(onInfo)
  return babelConf({ plugins: [plugin] })
}

let isRunning = false
let plugin = null
let onInfoCb = null

function getPlugin(onInfo) {
  // update info cb per-call
  onInfoCb = onInfo

  // dont update plugin per-call
  // (once on startup, once after initial build)
  if (!plugin || !isRunning) {
    if (opts('hasRunInitialBuild')) isRunning = true

    console.log('setting oninfo', onInfo && onInfo.toString())
    plugin = MotionTransform.file(fileConf({
      firstRun: !isRunning,
      onInfo
    }))
  }

  return plugin
}

function fileConf({ firstRun, onInfo = id }) {
  let info

  const onImports = (imports : string) => info.imports.push(imports)
  const onExports = (exports : string) => info.isExported = true
  const onCold = (val : boolean) => info.isCold = val

  const onStart = () => {
    console.log('start file')
    info = {
      imports: [],
      isCold: false,
      isExported: false
    }
  }

  const onFinish = metadata => {
    const { usedHelpers, modules: { imports } } = metadata
    const importedHelpers = usedHelpers && usedHelpers.map(name => `babel-runtime/helpers/${name}`) || []
    const importNames = imports.map(i => i.source)
    const result = {
      imports: _.uniq([].concat(
        importNames,
        (info.imports || []),
        (importedHelpers || []),
        babelRuntimeRequire(res.code)
      )),
      isExported: info.isExported,
      isHot: !info.isCold
    }

    onInfo(result)
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
    onStart,
    onImports,
    onExports,
    onCold,
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

export function babelConf(_config) {
  const config = {
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
    ..._config
  }

  const userConf = opts('config').babel

  if (userConf)
    return _.merge(config, userConf)
  else
    return config
}


export default {
  app,
  file
}
