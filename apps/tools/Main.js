store State {
  @hovered = false
  @dragging = false
}

store Keys {
  @ctrl = false
}

f = () => window.Flint;
let listeners = []

qsa = (sel) => document.querySelectorAll(sel)

listen = (name, listener) => listeners.push({ [name] : listener });
emit = (name, data) => listeners.forEach(listener =>
  listener[name] && listener[name](data));

localGet = (name) => localStorage.getItem(name) == 'undefined' ?
  undefined : JSON.parse(localStorage.getItem(name))
localSet = (name, val) => localStorage.setItem(name, JSON.stringify(val))

setTimeout(() => {
  flint = f()
  if (flint && flint.snapshots) {
    emit('newSnapshot', flint.snapshots);
    emit('viewChange');
    flint.on('newSnapshot', data => emit('snapshot', flint.snapshots));
    flint.on('viewChange', () => emit('viewChange'));
  }
}, 500);

// hotkey for toggle
addEventListener('keydown', e => {
  if (e.ctrlKey) devTools.Keys.@ctrl = true
})
addEventListener('keyup', e => {
  if (e.ctrlKey) devTools.Keys.@ctrl = false
})
addEventListener('keydown', e => {
  if (devTools.Keys.@ctrl) {
    // F
    if (e.keyCode === 70) emit('toggleBar')
    // S
    if (e.keyCode === 83) emit('toggleState')
  }
})

view Main {
  @currentEntityId = null
  addEventListener('mousedown', e => {
    if (e.ctrlKey || e.button == 2)
      @currentEntityId = e.target.getAttribute('data-flint-id')
  })

  window.showInspector = () => {
    devInspector.link(@currentEntityId)
  }

  @stateHide = localGet('stateHide')
  @barHide = localGet('barHide')
  @distance = 0
  @snapshots = []
  @cur = 0
  @target = null

  @showDarkness = false
  @darknessBounds = {}

  getDarkness = (view) => {
    @target = qsa(".view-" + view.toLowerCase())[0]
    @darkStyle = @target.getBoundingClientRect()
    @darkStyle.borderRadius = @target.style.borderRadius || "0px"
    @showDarkness = true
  }

  listen('snapshot', data => {
    return // timeline is turned off for now
    @snapshots = data
    @cur = @snapshots.length
  })

  listen('toggleBar', () => {
    @barHide = !@barHide
    localSet('barHide', @barHide)
  })

  listen('toggleState', () => {
    @stateHide = !@stateHide
    localSet('stateHide', @stateHide)
  })

  @traveling = false

  window.dark = getDarkness

  //    <Darkness shown = {@showDarkness} {...@darkStyle} />
  toSnapshot = (index) => {
    f().timeTraveling = true
    f().toSnapshot(index)
    @cur = index
  }

  scrub = to => {
    index = Math.floor(to * @snapshots.length)
    toSnapshot(index)
  }

  playNext = () => toSnapshot(@cur + 1)

  <Errors />
  <Installer />
  <State if={false} hide={@stateHide} />
  <Bar if={false} hide={@barHide}>
    <row>
      <Logo onClick :: {showNPM()} />
      <Console />
      <Player
        scrub={scrub}
        playNext = {playNext}
        snapshots={@snapshots}
        cur={@cur}
      />
      <Controls />
      <Inspector />
      <Scrubber
        scrub={scrub}
        snapshots={@snapshots}
        cur={@cur}
      />
    </row>
  </Bar>

  $row = {
    height: 34,
    opacity: 0.95,
    color: '#333',
    flexFlow: 'row',
    pointerEvents: 'all',
    transition: 'all ease-in 100ms',
  }
}
