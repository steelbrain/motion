view Main {
  const internal = window.__isDevingDevTools

  <link rel="stylesheet" property="stylesheet" href="/__/tools/static/tools.css" />

  <Errors />
  <Installer />

  <Inspector if={internal} />
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

import { spring, Motion } from 'react-motion'

view Circle {
  let c = () => Math.round(Math.random()*255)
  let base = {
    background: [c(), c(), c()],
    position: 'absolute',
    top: view.props.top,
    left: view.props.left,
    width: 80, height: 80,
    borderRadius: 100
  }
  let style = scale =>
    ({ ...base, transform: { scale } })

  <Motion defaultStyle={{x: 0}}
    style={{x: spring(1, [300, 10])}}>
    {s => <circle style={style(s.x)} /> }
  </Motion>
}
  
