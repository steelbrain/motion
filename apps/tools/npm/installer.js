const tools = window._DT

view Installer {
  let version = ''
  let versions = []
  let name = ''
  let error = ''
  let state = 0

  tools.on('package:install', () => {
    state = 1
    name = tools.data.name
  })

  tools.on('package:installed', () => {
    state = 2
    setTimeout(() => state = 0, 2000)
  })

  tools.on('package:error', () => {
    state = 3
    name = tools.data.name
    error = tools.data.error
    setTimeout(() => state = 0, 2000)
  })

  tools.on('package:select', () => {
    state = 4
    versions = tools.data.versions
  })

  const selectVersion = v => {
    version = v
    tools.data.version = v
    tools.emitter.emit('package:select')
    state = 1
  }

  const closeModal = () => state = 0

  const title = state => {
    switch(state) {
      case 1: return `Installing ${name}${version ? ' ' + version : ''}...`
      case 2: return `Installed ${name}!`
      case 3: return `Error: ${name}`
      case 4: return `Select version`
    }
  }

  const body = state => {
    switch(state) {
      case 1: return null
      case 2: return null
      case 3: return error
      case 4: return <Versions versions={versions} onSelect={selectVersion} />
    }
  }

  <Modal
    open={state > 0}
    onClose={closeModal}
    title={title(state)}>
    <InstallerLoading if={false && state < 2} />
    {body(state)}
  </Modal>
}

view Versions {
  <version repeat={view.props.versions} onClick={() => view.props.onSelect(_)}>
    <inner>
      <v key={'v' + _index}>{_.version}</v>
      <info>{_.description}</info>
      <a href={_.homepage} target="_blank">Info</a>
    </inner>
  </version>

  $version = {
    textAlign: 'left',
    padding: [2, 4],
    borderRadius: 2
  }

  $inner = {
    flexFlow: 'row'
  }

  $v = {
    flexGrow: 1,
    fontWeight: 'bold',

    ':hover': {
      background: '#fff',
      cursor: 'pointer'
    }
  }

  $info = {
  }
}