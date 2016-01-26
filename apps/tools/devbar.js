const avg = xs => {
  let sum = 0
  for (var i = 0; i < xs.length; i++){
    sum += parseInt(xs[i], 10)
  }
  return sum / xs.length
}

view DevBar {
  let fps = 0
  let hud = false
  let times = []
  let avgTime = 0

  let pinned = localStorage.getItem('devbar') === 'true'
  on.event('hot:finished', ({ time }) => {
    if (pinned) {
      times.push(time)
      avgTime = avg(times)
      fps = 1000 / avgTime
    }
  })

  let togglePin = () => {
    // localStorage.setItem('devbar', pinned)
  }

  //on.event('hud:show', () => hud = true)
  //on.event('hud:hide', () => hud = false)

  <bar if={hud || pinned}>
    <fps>
      <label>Live: {(''+fps).substr(0, 6)} FPS</label>
      <button onClick={() => times = []}>reset</button>
    </fps>
    {/*<pin onClick={togglePin }>Pin</pin>*/}
  </bar>

  $bar = {
    flexFlow: 'row',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    border: [1, 'solid', '#ccc'],
    padding: [10, 15],
  }

  $pin = {
    position: 'abosulte',
    right: 10,
    top: 3,
  }

  $label = {
    flexFlow: 'row',
    fontSize: 15,
    marginTop: 1,
    fontWeight: 'bold',
  }

  $fps = {
    flexFlow: 'row',
  }

  $button = {
    marginLeft: 20,
  }
}
