'use babel'

import Point from 'atom-text-buffer-point'
import { CompositeDisposable } from 'sb-event-kit'
import Autocomplete from './autocomplete'
import { collectViews, getObjectAtPosition, POSITION_TYPE } from './helpers'

export default class Editor {
  constructor() {
    this.subscriptions = new CompositeDisposable()
    this.autocomplete = new Autocomplete()

    this.subscriptions.add(this.autocomplete)
  }

  activate(bridge) {
    this.subscriptions.add(bridge.onDidReceiveMessage('editor:autocomplete', message => {
      message.result = {
        suggestions: this.complete(message.text, message.position)
      }
    }))
    this.subscriptions.add(bridge.onDidReceiveMessage('editor:collect:views', message => {
      message.result = {
        views: collectViews(message.contents || '')
      }
    }))
  }

  complete(text, position) {
    const point = Point.fromObject(position)
    const positionInfo = this.positionInfo(text, point)

    return this.autocomplete.complete(text, point, positionInfo)
  }

  positionInfo(text, position) {
    const info = {
      views: collectViews(text),
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

  dispose() {
    this.subscriptions.dispose()
  }
}
