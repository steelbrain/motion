'use babel'

import string_score from 'sb-string_score'
import {decamelize} from 'humps'
import Styles from './autocomplete-styles'
import {POSITION_TYPE, getRowFromText} from './helpers'

const STYLE_VALUE_REGEX = /['"]?(\S+)['"]?: *(['"]?([^,"]*))$/
const VIEW_NAME_REGEX = /^\s*(\$[a-zA-Z0-9]*)$/
const PREFIX_REGEX = /['"]?([a-zA-Z0-9]+)$/

export default class Autocomplete {
  complete(text, position, positionInfo) {

    if (positionInfo.active === null) {
      return []
    }

    if (positionInfo.position === POSITION_TYPE.STYLE) {
      return this.completeStyle(text, position)
    }

    if (positionInfo.position === POSITION_TYPE.VIEW_JSX) {
      // TODO: Autocomplete jsx tags maybe?
      return []
    }

    if (positionInfo.position === POSITION_TYPE.VIEW_TOP) {
      return this.completeViewNames(positionInfo.active, text, position)
    }
  }

  completeStyle(text, position) {
    const lineText = getRowFromText(text, position.row).slice(0, position.column)
    const value = STYLE_VALUE_REGEX.exec(lineText)
    if (value !== null) {
      return this.completeStyleValue(value[1], value[2], value[3])
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

  completeStyleValue(name, prefix, scoreBase) {
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
        matchScore: string_score(name, scoreBase)
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
    let suggestions = []
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
    suggestions = suggestions.sort(function(a, b) {
      return b.matchScore - a.matchScore
    }).filter(function(suggestion) {
      const key = suggestion.name.substr(1)
      return !(key in view.styles)
    })
    if (prefix !== '') {
      suggestions = suggestions.filter(function(item) {
        return item.matchScore !== 0
      })
    }
    return suggestions
  }
}
