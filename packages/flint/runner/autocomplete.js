'use babel'

import {transformFile, pointWithinRange, getObjectAtPosition} from './helpers'
import Point from 'atom-text-buffer-point'

export default class Autocomplete {
  constructor() {

  }
  provideAutocomplete(text, position) {
    const point = Point.fromObject(position)

    let views = {}
    transformFile(text, {
      onMeta: function(meta) {
        views = meta.views
      }
    })

    const activeView = getObjectAtPosition(views, point)
    console.log(activeView)
    return []
  }
  activate() {

  }
  dispose() {

  }
}
