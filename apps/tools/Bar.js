view Bar {
  <bar>
    <overlay />
    {^children}
  </bar>

  $bar = {
    maxHeight: 200,
    fontFamily: 'Helvetica',
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: ^hide ? -60 : 0,
    transition: 'all ease-in 100ms',
    pointerEvents: 'none',
    backgroundColor: '#fafafa',
    WebkitUserSelect: 'none'
  }

  $overlay = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
    opacity: 0.4
  }
}
