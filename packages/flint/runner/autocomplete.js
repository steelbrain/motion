'use babel'

import {transformFile, pointWithinRange, getObjectAtPosition} from './helpers'
import Point from 'atom-text-buffer-point'

export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}

export default class Autocomplete {
  provideAutocomplete(text, position) {
    position = Point.fromObject(position)
    const views = this.scanViews(text)
    const viewsActive = getObjectAtPosition(views, position)
    if (viewsActive === null) {
      // We're at top level in file
      return []
    }
    const viewsPosition = this.getPositionInfo(viewsActive, position)
    if (viewsPosition === POSITION_TYPE.STYLE) {
      // css
    } else if (viewsPosition === POSITION_TYPE.VIEW_JSX) {
      // jsx tags
    } else if (viewsPosition === POSITION_TYPE.VIEW_TOP) {
      // maybe autocomplete $h1?
    }
    return []
  }
  scanViews(text) {
    let views = {}
    transformFile(text, {
      onMeta: function(meta) {
        views = meta.views
      }
    })
    return views
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
  getStyleAutocomplete() {

  }
}
