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
      case 1: return `Installing ${name}${version ? ' ' + version : ''}...`; break
      case 2: return `Installed ${name}!`; break
      case 3: return `Error: ${name}`; break
      case 4: return `Select version`; break
    }
  }

  const body = state => {
    switch(state) {
      case 1: return null; break
      case 2: return null; break
      case 3: return error; break
      case 4: return <Versions
        versions={versions}
        onSelect={selectVersion}
      />; break
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

view InstallerLoading {
  <svg viewBox="0 14 32 18" width="32" height="4" fill="#f20" preserveAspectRatio="none">
    <path class="first" opacity="0.8" transform="translate(0 0)" d="M2 14 V18 H6 V14z">
      <animateTransform attributeName="transform" type="translate" values="0 0; 24 0; 0 0" dur="2s" begin="0" repeatCount="indefinite" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline" />
    </path>
    <path class="second" opacity="0.5" transform="translate(0 0)" d="M0 14 V18 H8 V14z">
      <animateTransform attributeName="transform" type="translate" values="0 0; 24 0; 0 0" dur="2s" begin="0.1s" repeatCount="indefinite" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline" />
    </path>
    <path class="third" opacity="0.25" transform="translate(0 0)" d="M0 14 V18 H8 V14z">
      <animateTransform attributeName="transform" type="translate" values="0 0; 24 0; 0 0" dur="2s" begin="0.2s" repeatCount="indefinite" keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8" calcMode="spline" />
    </path>
  </svg>

  $svg = {
    position: 'absolute',
    bottom: 0,
    right: '50%',
    marginRight: -50,
    width: 100,
    height: 17,
    marginBottom: -15
  }
}

view Versions {
  <version repeat={^versions} onClick={() => ^onSelect(_)}>
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