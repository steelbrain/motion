clean:
	rm -rf packages/*/lib

build: clean
	./scripts/build.sh

watch: clean
	scripts/build.sh --watch

bootstrap:
	./scripts/submodules.sh
	npm install
	node scripts/bootstrap.js
