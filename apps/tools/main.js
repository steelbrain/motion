view Main {
  const internal = window.__isDevingDevTools

  <link rel="stylesheet" property="stylesheet" href="/__/tools/static/tools.css" />

  <Errors />
  <Installer />

  <Inspector if={internal} />
  <Test if={internal} />
  <OtherTest if={internal} />

  $ = {
    position: 'fixed',
    pointerEvents: 'none',
    top: 0, left: 0,
    right: 0, bottom: 0,
    zIndex: 2147483647
  }
}

view Test {
  let num = 0
  let str = 'hello'
  let obj = {
    one: 'two',
    three: 4,
    arr: [1,2,3,4]
  }

  <h1>
    inspect me
  </h1>

  $ = {
    pointerEvents: 'all'
  }
}

view OtherTest {
  let hello = 'WORLD'
  let obj = { one: 'two', three: 4, arr: [1,2,3,4] }

  <h3>
    inspect me
  </h3>

  $ = {
    pointerEvents: 'all'
  }
}