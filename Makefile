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
	git commit -am 'versions' --quiet
	git push origin head --quiet

cli: ready
	scripts/release.sh cli --patch
	make push

flint.js: ready
	scripts/release.sh flint.js --patch
	make push

runner: ready
	scripts/release.sh flint-runner --patch
	make push

transform: ready
	scripts/release.sh transform --patch
	make push

styles: ready
	scripts/release.sh nice-styles --patch
	make push

tools: ready
	scripts/release.sh tools --patch
	make push

all: ready
	scripts/release.sh all --patch
	make push