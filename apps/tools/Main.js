const replaceViewDef = /Flint.view\(\"([a-zA-Z]*)\".*\{/g ///Flint.view\(\"([^\"]*)([^_]*)/g

const unflint = msg =>
  // get around flint style syntax
  msg.replace(replaceViewDef, 'view $' + '1 {') //'view $' + '1')

view Main {
  <ErrorBar />
}

let msg = 'Flint.view("ErrorBar", "2029915753", (__) => {'

view ErrorBar {
  const errorBG = '#eb522d'

  <errorBar>{unflint(msg)}</errorBar>

  $errorBar = {
    background: errorBG,
    position: 'fixed',
    height: 120,
    left: 100,
    right: 100,
    color: 'white',
    fontSize: 30,
    padding: [10, 30],
    bottom: 100,
  }
}
