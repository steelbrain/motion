'use babel'

import {CompositeDisposable} from 'sb-event-kit'
import Autocomplete from './autocomplete'

export default class Editor {
  constructor() {
    this.subscriptions = new CompositeDisposable()
    this.autocomplete = new Autocomplete()

    this.subscriptions.add(this.autocomplete)
  }
  activate(bridge) {
    this.autocomplete.activate(bridge)
  }
  complete(text, position) {
    return this.autocomplete.complete(text, position)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
