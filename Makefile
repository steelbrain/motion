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


# easy release

# since we are now shrinkwrapping releases
# we have to release all the way up the chain
# even if just updating a leaf node dependency

# for example
#   cli owns runner owns flint.js
#   so, to release flint.js, we release in order:
#   flint.js then runner then cli

# TODO some sort of auto detection for if things change
# so this can just be "make release" and it picks the right things

ready:
	git pull --rebase

patch: ready
	scripts/release.js --patch