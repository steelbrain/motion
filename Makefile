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

cli:
	scripts/release.sh cli

flint.js:
	scripts/release.sh flint.js

runner:
	scripts/release.sh runner

tools:
	scripts/release.sh tools

all: cli flint.js runner tools