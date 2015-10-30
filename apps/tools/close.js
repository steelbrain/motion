view Close {
  <close onClick={view.props.onClick}>
    x
  </close>

  $close = {
    position: 'absolute',
    right: 0,
    top: 0,
    width: view.props.size || 50,
    height: view.props.size || 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 1,
    opacity: 0.5,
    cursor: 'pointer',

    ':hover': {
      opacity: 1
    }
  }
}