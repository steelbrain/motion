import FlintTransform from 'flint-transform'
import { CompositeDisposable, Emitter } from 'sb-event-kit'
import { isProduction } from './gulp/lib/helpers'
import opts from './opts'

// The purpose of this class is to serve as a proxy to transform package
// The transform package uses files instead of instances to store state
// Therefore this file is required to fix an overwrite bug, discovered
// by autocomplete

export default class Transform {
  constructor() {
    this.emitter = new Emitter()
    this.disposables = []
    this.transform = null
  }
  get(config) {
    if (this.transform === null) {
      this.transform = FlintTransform.file({
        basePath: opts('appDir'),
        production: isProduction(),
        selectorPrefix: opts('config').selectorPrefix || '#_flintapp ',
        routing: opts('config').routing,
        log: () => {
          this.emitter.emit('log', ...arguments)
        },
        writeStyle: (a, b) => {
          this.emitter.emit('writeStyle', a, b)
        },
        onMeta: (state) => {
          this.emitter.emit('onMeta', state)
        },
        onImports: (file, imports) => {
          this.emitter.emit('onImports', file, imports)
        },
        onExports: (file, imports) => {
          this.emitter.emit('onExports', file, imports)
        }
      })
    }

    const disposable = new CompositeDisposable()
    if (config.log) {
      disposable.add(this.emitter.on('log', config.log))
    }
    if (config.writeStyle) {
      disposable.add(this.emitter.on('writeStyle', config.writeStyle))
    }
    if (config.onMeta) {
      disposable.add(this.emitter.on('onMeta', config.onMeta))
    }
    if (config.onImports) {
      disposable.add(this.emitter.on('onImports', config.onImports))
    }
    if (config.onExports) {
      disposable.add(this.emitter.on('onExports', config.onExports))
    }
    this.disposables.push(disposable)
    return this.transform
  }
  disposeLast() {
    const disposable = this.disposables.pop()
    if (disposable) {
      disposable.dispose()
    }
  }
  dispose() {
    this.emitter.dispose()
    this.disposables.forEach(function(disposable) {
      disposable.dispose()
    })
    this.disposable = null
    this.transform = null
  }
}
