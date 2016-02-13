import gutil from 'gulp-util'
import through from 'through2'
import applySourceMap from 'vinyl-sourcemaps-apply'
import replaceExt from 'replace-ext'
import { babel } from '../lib/requires'
import onMeta from './lib/onMeta'
import config from './lib/config'
import writeStyle from '../lib/writeStyle'
import { log } from '../lib/fns'
import getMatches from '../lib/getMatches'

export function file(opts) {
	return babelStream({
		transformer: flintFile,
		opts
	})
}

export function app(opts) {
	return babelStream({
		transformer: flintApp,
		opts
	})
}

export default { file, app }

function babelOpts(file, opts) {
	return Object.assign({}, opts, {
		filename: file.path,
		filenameRelative: file.relative,
		sourceMap: Boolean(file.sourceMap)
	})
}

function flintApp(file) {
	let res = babel().transform(
		file.contents.toString(),
		babelOpts(file, config.app())
	)
	return { res, file }
}

const babelCoreRequire =
	/require\(\'(babel\-runtime\/core\-js\/[a-zA-Z0-9]+\/?[a-zA-Z0-9]*\/?[a-zA-Z0-9]*)\'\)/g

const getBabelCoreRequires = src =>
	getMatches(src, babelCoreRequire, 1)

function flintFile(file) {
	let track = {
		imports: [],
		isExported: false
	}

	const onImports = (imports : string) => track.imports.push(imports)
	const onExports = (val : boolean) => track.isExported = val

	let res = babel().transform(
		file.contents.toString(),
		babelOpts(file, config.file({
			log,
			onMeta,
			writeStyle,
			onImports,
			onExports
		}))
	)

	const { usedHelpers, modules: { imports } } = res.metadata
	const importedHelpers = usedHelpers && usedHelpers.map(name => `babel-runtime/helpers/${name}`) || []
	const importNames = imports.map(i => i.source)

	let meta = {
		imports: [].concat(
			importNames,
			(track.imports || []),
			(importedHelpers || []),
			getBabelCoreRequires(res.code)
		),
		isExported: track.isExported,
	}

	log.gulp('meta', meta)

	return { res, meta }
}

function babelStream({ transformer }) {
	return through.obj(function(file, enc, cb) {
		if (file.isNull()) {
			cb(null, file)
			return
		}

		try {
			const { meta, res } = transformer(file)

			file.babel = meta

			if (file.sourceMap && res.map) {
				res.map.file = replaceExt(res.map.file, '.js')
				applySourceMap(file, res.map)
			}

			file.contents = new Buffer(res.code)
			file.path = replaceExt(file.path, '.js')
			this.push(file)
		}
		catch(err) {
			this.emit('error', new gutil.PluginError('gulp-babel', err, {
				fileName: file.path,
				showProperties: false
			}))
		}

		cb()
	})
}