clean:
	rm -rf packages/*/lib

build: clean
	./scripts/build.sh

watch: clean
	scripts/build.sh --watch

bootstrap:
	npm install
	node scripts/bootstrap.js

link:
	node scripts/links.js


# release (npm patch)

ready:
	git pull --rebase

cli: ready
	scripts/release.sh cli
	git commit -am 'vbump cli'

flint.js: ready
	scripts/release.sh flint.js
	git commit -am 'vbump flint.js'

runner: ready
	scripts/release.sh runner
	git commit -am 'vbump runner'

transform: ready
	scripts/release.sh transform
	git commit -am 'vbump flint.js'

tools: ready
	scripts/release.sh tools
	git commit -am 'vbump tools'

all: ready
	scripts/release.sh all
