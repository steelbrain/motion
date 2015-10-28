let id = Math.ceil(Math.random() * 10)
export const uid = () => id++
export const type = value => Object.prototype.toString.call(value).slice(8, -1)

view Main {
  <link rel="stylesheet" property="stylesheet" href="__/static/tools.css" />
  <Errors />
  <Installer />
  <State />

  <Test if={__isDevingDevTools} />

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
    three: 4
  }

  <h1>
    inspect me
  </h1>

  $ = {
    pointerEvents: 'all'
  }
}