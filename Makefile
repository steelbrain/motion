clean:
	-rm -rf packages/*/lib

build: clean
	./scripts/build.sh

watch: clean
	scripts/build.sh --watch

bootstrap:
	npm install
	node scripts/bootstrap.js

link:
	node scripts/links.js


# easy release

ready:
	git pull --rebase

push:
	git push origin head

cli: ready
	scripts/release.sh cli
	push

flint.js: ready
	scripts/release.sh flint.js
	push

runner: ready
	scripts/release.sh runner
	push

transform: ready
	scripts/release.sh transform
	push

styles: ready
	scripts/release.sh nice-styles
	push

all: ready
	scripts/release.sh all
	push
