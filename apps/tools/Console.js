view Console {
  let value = "Console"

  handleFocus = () => {
    if (value === 'Console')
      value = ''
  }
  handleBlur = () => {
    if (value === '')
      value = 'Console'
  }

  <Arrow />
  <input
    sync={value}
    onFocus={handleFocus}
    onBlur={handleBlur} />

  $ = {
    flexFlow: 'row',
    flexGrow: 1,
    position: 'relative'
  }

  $input = {
    flexGrow: 1,
    background: 'none',
    border: 'none',
    height: '100%',
    color: '#777',
    fontSize: 15,
    padding: '8px 0 9px 22px',
    fontFamily: 'Source Code Pro, Menlo, Monaco, monospace',
    transition: 'all ease-in 100ms',

    ':focus': {
      color: '#fff',
      background: 'none'
    },

    ':hover': {
      background: 'none',
      color: '#ccc'
    }
  }
}

view Console.Arrow {
  <svg viewBox="0 0 306 306">
    <polygon points="94.35,0 58.65,35.7 175.95,153 58.65,270.3 94.35,306 247.35,153" />
  </svg>

  $svg = {
    fill: '#888',
    zIndex: 1000,
    width: 12,
    height: 12,
    top: 12,
    left: 6,
    position: 'absolute',
    opacity: 0.5,
    shapeRendering: 'crispEdges'
  }
}
