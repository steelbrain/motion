view Close {
  <close onClick={^onClick}>
    x
  </close>

  $close = {
    position: 'absolute',
    right: 0,
    top: 0,
    width: ^size || 50,
    height: ^size || 50,
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