furthest = (n, ls) => {
  index = ls.map(i => i < n).indexOf(false)
  return ls[((index == -1 ? ls.length : index)-1)]
}

view Inspector {
  liveProfiling = false
  @curViewName = null
  @curViewLine = null
  @editorState = null

  /*

    @appView = {
      '/path/to/filename.js': {
        views: {
          0: 'Main',
          10: 'Guess',   // index to name of view
          20: 'Other'
        }
        locations: [0, 10, 20] // index of view
      }
    }

    @editorState = {
      file: '/path/to/filename.js',
      line: 96
    }

  */
  @appViews = null

  window._DT.on('editor:location', () => {
    if (!liveProfiling) return
    @editorState = window._DT.editorLocation

    if (@appViews) {
      viewState = @appViews[@editorState.file]
      @curViewLine = furthest(@editorState.line, viewState.locations)
      @curViewName = viewState.views[@curViewLine]
      dark(@curViewName.toLowerCase())
    }
  });

  window._DT.on('view:locations', () => {
    if (!liveProfiling) return
    @appViews = window._DT.viewLocations
  });

  <inspector></inspector>

  $inspector = {
    height: '100%'
  }

  $button = {
    height: '100%',
    lineHeight: '45px',
    padding: '0 20px',
    color: '#fff',
    flexFlow: 'row',
    border: 'none'
  }
}
