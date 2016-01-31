'use babel'

import {CompositeDisposable} from 'sb-event-kit'
import Autocomplete from './autocomplete'
import {logError} from '../lib/fns'

export default class Editor {
  constructor() {
    this.subscriptions = new CompositeDisposable()
    this.autocomplete = new Autocomplete()

    this.subscriptions.add(this.autocomplete)
  }
  activate(bridge) {
    this.subscriptions.add(bridge.onMessage('editor:autocomplete', message => {
      const suggestions = this.complete(message.text, message.position)
      bridge.broadcast('editor:autocomplete', {id: message.id, suggestions})
    }))
  }
  complete(text, position) {
    try {
      return this.autocomplete.complete(text, position)
    } catch (_) {
      logError(_)
      return []
    }
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
