
view Main {
  <ErrorBar />
}

view ErrorBar {
  const errorBG = '#eb522d'

  <errorBar>
    Please close JSX, line 30
  </errorBar>

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
