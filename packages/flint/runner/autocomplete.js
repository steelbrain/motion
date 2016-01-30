'use babel'

import Point from 'atom-text-buffer-point'
import string_score from 'sb-string_score'
import {transformFile, pointWithinRange, getObjectAtPosition, getRowFromText} from './helpers'
import Styles from './autocomplete-styles'

export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}
const VALUE_VALIDATION_REGEX = /['"]?\S+['"]?: *['"]?[^,"]*$/
const PREFIX_REGEX = /['"]?([a-zA-Z0-9]+)$/

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
      return this.getStyleAutocomplete(text, position)
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
  getStyleAutocomplete(text, position) {
    const lineText = getRowFromText(text, position.row).slice(0, position.column)
    if (VALUE_VALIDATION_REGEX.test(lineText)) {
      // Ignore value suggestions, 'cause we already provided them with key
      return []
    }
    // Autocomplete key
    const suggestions = Styles.slice()
    suggestions.sort(function(a, b) {
      return b.strength - a.strength
    })

    let prefix = PREFIX_REGEX.exec(lineText)
    prefix = prefix ? prefix[1] : ''
    if (prefix === '') {
      return suggestions
    }
    suggestions.forEach(function(suggestion) {
      suggestion.matchScore = string_score(suggestion.name, prefix)
    })
    suggestions.sort(function(a, b) {
      return b.matchScore - a.matchScore
    })
    return suggestions.filter(function(item) {
      return item.matchScore !== 0
    })
  }
}
