addEvent = (e, cb) => window.addEventListener(e, cb)
removeEvent = (e, cb) => window.removeEventListener(e, cb)

view Scrubber {
  size = 16
  maxLeft = '98%'

  @dragging = false
  @left = maxLeft

  inRange = percent =>
    Math.max(1, Math.min(percent, parseInt(maxLeft)))

  setLeft = () => {
    if (@dragging) return
    // return (100*(^cur / ^snapshots.length)) + '%'
    if (^cur === 0 && ^snapshots.length === 0) {
      return @left = maxLeft
    }
    @left = inRange(100*(^cur / ^snapshots.length)) + '%'
  }

  beforeRender = () => {
    setLeft()
  }

  withinWindow = x => Math.max(Math.min(x, window.innerWidth - 10) - size, 0)

  onProps = setLeft

  @moveListener = null
  @upListener = null

  drag = (e) => {
    @dragging = true
    @left = withinWindow(e.pageX);
    ^scrub(@left / window.innerWidth);
  }

  dragEnd = () => {
    @dragging = false
    perc = @left / window.innerWidth
    if (perc > 0.88) {
      ^scrub(^snapshots.length)
      @left = maxLeft
    } else {
      setLeft()
    }
  }

  dragStart = () => {
    addEvent('mousemove', drag)

    unbindDragEnd = () => {
      removeEvent('mousemove', drag)
      removeEvent('mouseup', unbindDragEnd)
      dragEnd()
    }

    addEvent('mouseup', unbindDragEnd)
  }

  <bar>
    <pos
      class={{ dragging: @dragging }}
      mouseDown = {dragStart}
    />
  </bar>

  $bar = {
    background: 'rgba(0,0,0,0.2)',
    height: (@dragging) ? 3 : 0, //State.@hovered ||
    position: 'absolute',
    borderTop: '1px solid rgba(0, 0, 0, 0.0005)',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    transition: 'all ease-in 100ms'
  }

  $pos = {
    position: 'absolute',
    top: -(size * .49),
    borderRadius: 100,
    left: @left,
    width: size,
    height: size,
    background: 'linear-gradient(#3CAAFF, #2D7DBA)',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'transform 50ms, left 200ms ease-in',

    // ':hover': $.posActive
  }

  $.dragging = {
    transform: `scale(1.5)`,
    transition: 'none',
    background: 'linear-gradient(#5CC2FF, #4E92BA)'
  }
}
