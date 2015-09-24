view Button {
  <Icon>{^icon}</Icon>
  <child if={^children}>{^children}</child>

  $ = {
    flexFlow: 'row',
    cursor: 'pointer',
    fill: 'currentColor',
    margin: 'auto',
    flexGrow: 1,
    justifyContent: 'center',
    color: '#000',
    padding: '2px 5px',
    transition: 'opacity ease-in 100ms, transform ease-in 40ms',
    opacity: 0.9,

    ':hover': {
      color: '#000',
      textShadow: '0 -1px 0 #fff',
      opacity: 1,
      transform: 'scale(1.05)'
    }
  }

  $child = {
    alignSelf: 'center',
    padding: '0 5px',
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: 600
  }
}
