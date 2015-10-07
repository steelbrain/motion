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

flint.js: ready
	scripts/release.sh flint.js

runner: ready
	scripts/release.sh runner

tools: ready
	scripts/release.sh tools

all: ready
	scripts/release.sh all
