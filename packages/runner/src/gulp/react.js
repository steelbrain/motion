var gutil = require('gulp-util');
var through = require('through2');
var react = require('flint-react-tools');
var applySourceMap = require('vinyl-sourcemaps-apply');

module.exports = function (opts) {
	opts = opts || {};

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-react', 'Streaming not supported'));
			return;
		}

		try {
			if (file.sourceMap) {
				opts = Object.assign(opts, {
					sourceMap: true,
					sourceFilename: file.relative
				});
			}

			var res = react.transformWithDetails(file.contents.toString(), opts);

			file.contents = new Buffer(res.code);
			file.path = gutil.replaceExtension(file.path, '.js');

			if (res.sourceMap && file.sourceMap) {
				applySourceMap(file, res.sourceMap);
			}

			this.push(file);
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-react', err, {
				fileName: file.path
			}));
		}

		cb();
	});
};
