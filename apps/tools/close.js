view Close {
  <close onClick={view.props.onClick}>
    x
  </close>

  $ = {
    position: 'absolute',
    right: 0,
    top: 0,
    fontSize: view.props.fontSize || 13,
    width: view.props.size || 50,
    height: view.props.size || 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 1,
    opacity: 0.15,
    cursor: 'pointer',
    transition: 'all ease-in 200ms',

    ':hover': {
      opacity: 0.4
    }
  }
}