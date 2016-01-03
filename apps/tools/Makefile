bootstrap:
	cd .flint && \
	npm install --loglevel=error && \
	npm link

watch:
	flint build --watch

# patch:
# 	cd .flint && \
# 	npm version patch

release:
	cd .flint && \
	npm publish

release-patch: patch release
