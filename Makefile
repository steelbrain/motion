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