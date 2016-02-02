'use babel'

import Point from 'atom-text-buffer-point'
import {CompositeDisposable} from 'sb-event-kit'
import Autocomplete from './autocomplete'
import {logError} from '../lib/fns'
import {transformText, getObjectAtPosition, POSITION_TYPE} from './helpers'

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
    const point = Point.fromObject(position)
    let positionInfo

    // Do not log syntax errors to console
    try {
      positionInfo = this.positionInfo(text, point)
    } catch (_) {
      return []
    }

    // Errors caught here are probably internal, log them so we can debug
    try {
      return this.autocomplete.complete(text, point, positionInfo)
    } catch (_) {
      logError(_)
      return []
    }
  }

  positionInfo(text, position) {
    const info = {
      views: this.getViews(text),
      active: null,
      position: null
    }
    info.active = getObjectAtPosition(info.views, position)

    if (info.active) {
      info.position = this.getPositionInfo(info.active, position)
    }

    return info
  }

  getPositionInfo(view, position) {
    if (getObjectAtPosition(view.els, position)) {
      return POSITION_TYPE.VIEW_JSX
    }
    if (getObjectAtPosition(view.styles, position)) {
      return POSITION_TYPE.STYLE
    }
    return POSITION_TYPE.VIEW_TOP
  }

  getViews(text) {
    let views = {}
    transformText(text, {
      onMeta: function(meta) {
        views = meta.views
      }
    })
    return views
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
