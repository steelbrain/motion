watch:
	flint build --watch

build:
	flint build

patch:
	cd .flint; \
	npm version patch
	make release

release:
	cd .flint; \
	npm publish
