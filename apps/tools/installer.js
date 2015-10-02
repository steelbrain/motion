view Installer {
  let name = ''
  let state = 0

  window._DT.on('package:install', () => {
    console.log("intalling package", window._DT.data)
    state = 1
    name = window._DT.data.name
  });

  window._DT.on('package:installed', () => {
    state = 2
    setTimeout(() => {
      state = 0
    }, 2000)
  });

  <InstallerLoading if={false && state < 2} />
  <two if={state == 1}>Installing {name}</two>
  <three if={state == 2}>Installed!</three>

  $ = {
    position: 'absolute',
    top: state > 0 ? 20 : -100,
    right: 20,
    padding: [6, 10],
    background: '#fff',
    border: '1px solid #ccc',
    boxShadow: '0 0 12px rgba(0,0,0,0.05)',
    borderRadius: 5,
    color: '#C43D2D',
    fontFamily: "'Source Code Pro', Menlo, Monaco, monospace",
    fontSize: 16,
    fontWeight: 'bold',
    transition: 'all ease-in 200ms',
    textAlign: 'center'
  }
}

view InstallerLoading {
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 14 32 18" width="32" height="4" fill="#f20" preserveAspectRatio="none">
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