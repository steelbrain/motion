view Main {
  <link rel="stylesheet" property="stylesheet" href="/__/tools/static/tools.css" />
  <Errors />
  <Installer />
  <Inspector />

  <Test if={window.__isDevingDevTools} />

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