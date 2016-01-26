clean:
	-rm -rf packages/*/lib

build: clean
	./scripts/build.sh

watch-core: clean
	scripts/build.sh --watch --notools

watch: clean
	scripts/build.sh --watch

bootstrap:
	npm install
	(cd flintjs-deps && npm prune && npm install)
	node scripts/bootstrap.js
	scripts/build.sh

ready:
	git pull --rebase

patch: ready
	node scripts/release.js --patch

patch-verbose:
	node scripts/release.js --patch --verbose

patch-tools: ready
	node scripts/release.js --patch tools

patch-flint: ready
	node scripts/release.js --patch flint

patch-flint.js: ready
	node scripts/release.js --patch flint.js

patch-transform: ready
	node scripts/release.js --patch transform

patch-nice-styles: ready
	node scripts/release.js --patch nice-styles