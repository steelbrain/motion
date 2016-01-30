'use babel'

import Point from 'atom-text-buffer-point'
import string_score from 'sb-string_score'
import {decamelize} from 'humps'
import {transformText, pointWithinRange, getObjectAtPosition, getRowFromText} from './helpers'
import Styles from './autocomplete-styles'

export const POSITION_TYPE = {
  VIEW_TOP: 'VIEW_TOP',
  VIEW_JSX: 'VIEW_JSX',
  STYLE: 'STYLE'
}
const STYLE_VALUE_REGEX = /['"]?(\S+)['"]?: *['"]?([^,"]*)$/
const VIEW_NAME_REGEX = /^\s*([a-zA-Z0-9$]*)$/
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
      return this.completeStyle(text, position)
    } else if (viewsPosition === POSITION_TYPE.VIEW_JSX) {
      // jsx tags
    } else if (viewsPosition === POSITION_TYPE.VIEW_TOP) {
      // maybe autocomplete $h1?
      return this.completeViewNames(viewsActive, text, position)
    }
    return []
  }
  scanViews(text) {
    let views = {}
    transformText(text, {
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
  completeStyle(text, position) {
    const lineText = getRowFromText(text, position.row).slice(0, position.column)
    const value = STYLE_VALUE_REGEX.exec(lineText)
    if (value !== null) {
      return this.completeStyleValue(value[1], value[2])
    } else {
      return this.completeStyleKey(lineText)
    }
  }
  completeStyleKey(lineText) {
    const suggestions = Styles.slice()
    suggestions.sort(function(a, b) {
      return b.strength - a.strength
    })

    let prefix = PREFIX_REGEX.exec(lineText)
    prefix = prefix ? prefix[1] : ''
    suggestions.forEach(function(suggestion) {
      suggestion.replacementPrefix = prefix
      suggestion.descriptionMoreURL = 'https://developer.mozilla.org/en/docs/Web/CSS/' + decamelize(suggestion.name, {separator: '-'})
      suggestion.type = 'css-key'
    })
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
  completeStyleValue(name, prefix) {
    let suggestion = null
    for (const entry of Styles) {
      if (entry.name === name) {
        suggestion = entry
        break
      }
    }
    if (suggestion === null) {
      return []
    }
    if (!Array.isArray(suggestion.options)) {
      return []
    }
    return suggestion.options.map(function(option) {
      const name = String(option)
      return {
        name: name,
        auto: option,
        description: '',
        type: 'css-value',
        replacementPrefix: prefix,
        matchScore: string_score(name, prefix)
      }
    }).sort(function(a, b) {
      return b.matchScore - a.matchScore
    })
  }
  completeViewNames(view, text, position) {
    const lineText = getRowFromText(text, position.row).slice(0, position.column)
    let prefix = VIEW_NAME_REGEX.exec(lineText)
    if (prefix === null) {
      // Not a view name scenario
      return []
    }
    prefix = prefix[1]
    const suggestions = []
    for (const key in view.els) {
      const name = '$' + key
      suggestions.push({
        name: name,
        description: '',
        type: 'view-name',
        replacementPrefix: prefix,
        matchScore: string_score(name, prefix)
      })
    }
    suggestions.sort(function(a, b) {
      return b.matchScore - a.matchScore
    })
    if (prefix === '') {
      return suggestions
    } else {
      return suggestions.filter(function(item) {
        return item.matchScore !== 0
      })
    }
  }
}
