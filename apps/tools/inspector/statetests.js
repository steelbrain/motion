import offset from 'mouse-event-offset'

view StateTests {
  <Tests.Name />
  <Tests.Boolean />
  <Tests.Counter />
  <Tests.Props />
  <Tests.Circles />
}

view Tests.Boolean {
  let dead = false
  <h1>is tupac dead? {dead.toString()}</h1>
  <button onClick={() => dead = !dead}>toggle</button>
}

view Tests.Props {
  let name = 'a string'

  <input sync={name} />
  <Test.PropsChild name={name} />

  $ = { marginTop: 20 }
}

view Test.PropsChild {
  prop name
  let count = 0

  <h1>my name is {name}</h1>
  <h4>counter to test state {count}</h4>
  <button onClick={() => count++}>up</button>
}

view Tests.Counter {
  let count = 0
  <h1>count is {count}</h1>
  <button onClick={() => count++}>up</button>
  <button onClick={() => count--}>down</button>
}

view Tests.Deep {
  let person = { name: 'nick', tools: ['js', 'juggling balls', 'coffee'] }
  <h1>deep</h1>
  <h2>{JSON.stringify(person)}</h2>
}

view Tests.Name {
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

view Tests.Circles {
  let coords = [[200, 200]]

  function addCircle(click) {
    coords.push(offset(click))
  }

  <circles onClick={addCircle}>
    <Tests.Circle
      repeat={coords}
      key={''+_[0]+_[1]}
      left={_[0]}
      top={_[1]}
    />
  </circles>

  $circles = { position: 'relative', background: '#eee', height: 400, width: 400 }
}

view Tests.Circle {
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
