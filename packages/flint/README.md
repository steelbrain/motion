Runner handles most build work for Flint.

- builder: copying, transforming files and assets for build time
- bundler: scanning, installing, bundling, uninstalling imported/exported files
- bridge: messages to/from browser/editor
- cache: file state cache (imports, etc)
- compiler: scan files for bundler tasks
- gulp: pipeline
- keys: watching for keypress in terminal
- opts: global options cache
- server: server