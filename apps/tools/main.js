/*
*/

view Main {
  const internal = window.__isDevingDevTools
  const showInspector = true //internal || window.location.search == '?inspect'

  <link rel="stylesheet" property="stylesheet" href="/__/tools/static/tools.css" />
  <link if={!internal} rel="stylesheet" property="stylesheet" href="/__/tools/styles.css" />

  <Errors />
  <Installer />

  <Inspector if={showInspector} />
  <Name if={internal} />
  <Counter if={internal} />
  <Circles if={internal} />

  $ = {
    position: 'fixed',
    pointerEvents: internal ? 'auto' : 'none',
    top: 0, left: 0,
    right: 0, bottom: 0,
    zIndex: 2147483647
  }
}

view Counter {
  let count = 0
  <h1>count is {count}</h1>
  <button onClick={() => count++}>up</button>
  <button onClick={() => count--}>down</button>
}

view Deep {
  let person = { name: 'nick', tools: ['js', 'juggling balls', 'coffee'] }
  <h1>deep</h1>
  <h2>{JSON.stringify(person)}</h2>
}

view Name {
  let first = 'nick'
  let last = 'cammarata'
  <h2>name is {first} {last}</h2>
  <input sync={first} />
  <input sync={last} />
  <button onClick={() => {
    first = 'nate';
    last = 'wienert';
  }}>nateify</button>
}

import offset from 'mouse-event-offset'

view Circles {
  let coords = [[200, 200]]

  function addCircle(click) {
    coords.push(offset(click))
  }

  <circles onClick={addCircle}>
    <Circle repeat={coords}
      left={_[0]}
      top={_[1]}
    />
  </circles>

  $circles = { position: 'relative', background: '#eee', height: 400, width: 400 }
}

view Circle {
  let c = () => Math.round(Math.random()*255)
  let base = {
    background: [c(), c(), c()],
    position: 'absolute',
    top: view.props.top,
    left: view.props.left,
    width: 118, height: 29,
    borderRadius: 27
  }
  let style = scale =>
    ({ ...base, transform: { scale } })

  <circle style={style(1)} />
}
