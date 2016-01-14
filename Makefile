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

# TODO adding nice version numbers to this commit messages

push:
	git commit -am 'publish' --quiet
	git push origin head --quiet

new: ready
	scripts/release.js

# all the things! (in the right order)
all: ready
	scripts/release.sh nice-styles --patch
	scripts/release.sh tools --patch
	scripts/release.sh transform --patch
	scripts/release.sh flint.js --patch
	scripts/release.sh flint-runner --patch
	scripts/release.sh cli --patch
	make push

# root
cli: ready
	scripts/release.sh cli --patch
	make push

# depeded on by cli
runner: ready
	scripts/release.sh flint-runner --patch
	scripts/release.sh cli --patch
	make push

# depended on by runner
flint.js: ready
	scripts/release.sh flint.js --patch
	scripts/release.sh flint-runner --patch
	scripts/release.sh cli --patch
	make push

# depended on by runner
transform: ready
	scripts/release.sh transform --patch
	scripts/release.sh flint-runner --patch
	scripts/release.sh cli --patch
	make push

# depended on by flint.js and runner
styles: ready
	scripts/release.sh nice-styles --patch
	scripts/release.sh flint.js --patch
	scripts/release.sh flint-runner --patch
	scripts/release.sh cli --patch
	make push

# depended on by runner
tools: ready
	scripts/release.sh tools --patch
	scripts/release.sh flint-runner --patch
	scripts/release.sh cli --patch
	make push