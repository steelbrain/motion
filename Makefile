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
	node scripts/bootstrap.js
	scripts/build.sh

link:
	node scripts/links.js


# easy release

ready:
	git pull --rebase

push:
	git push origin head

cli: ready
	scripts/release.sh cli
	make push

flint.js: ready
	scripts/release.sh flint.js
	make push

runner: ready
	scripts/release.sh flint-runner
	make push

transform: ready
	scripts/release.sh transform
	make push

styles: ready
	scripts/release.sh nice-styles
	make push

tools: ready
	scripts/release.sh tools
	make push

all: ready
	scripts/release.sh all
	make push