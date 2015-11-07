view Close {
  <close onClick={view.props.onClick}>
    x
  </close>

  $ = {
    position: 'absolute',
    right: 0,
    top: 0,
    fontSize: view.props.fontSize || 15, 
    width: view.props.size || 50,
    height: view.props.size || 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 1,
    opacity: 0.3,
    cursor: 'pointer',

    ':hover': {
      opacity: 1
    }
  }
}