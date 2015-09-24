popoverBG = '#fafafa'
isObject = obj => typeof obj === 'object' && !Array.isArray(obj) && obj !== null
getValue = label => f().values[devInspector.id][label]
update = (label, value) => {
  currentVal = getValue(label)
  if (!isNaN(value)) {value = +value} // if is number
  f().set(devInspector.id, label, value)
}

view FPopover {
  @isOpen = false
  @selector = null
  @states = []
  @props = []
  @view = {}

  window.addEventListener('keydown', e => {
    if (@isOpen && e.keyCode === 27)
      @isOpen = !@isOpen
  })

  window.devInspector = {
    link(id) {
      devInspector.id = id

      render = () => devInspector.refresh(f().values[id], f().activeViews[id])
      f().on("render:" + devInspector.id, render)
      f().on("traveling", render)
      render()
      @selector = '[data-flint-id="' + id + '"]'
      @isOpen = true
    },
    id: null,
    refresh(state, view) {
      @view = view
      @states = Object.keys(state)
        .map(label => ({ label, value: state[label] }))
      @props = Object.keys(view.props)
        .filter(name => !name.match(/(children|data-flint-id|className|style)$/))
        .map(label => ({ label, value: view.props[label] }))
    }
  }

  <Popover
    body={
      <box>
        <bg />
        <content>
          <viewName>
            <wrap>{@view.name}</wrap>
          </viewName>
          <Pane title="Props" variables={@props} />
          <Pane title="State" variables={@states} />
        </content>
      </box>
    }
    isOpen={@isOpen}
    tipSize={8}
    target={document.querySelectorAll(@selector)[0]}>
  </Popover>

  $Popover = {
    zIndex: 100000
  }

  $box = {
    position: 'relative'
  }

  $bg = {
    // backgroundImage: `url(${toolsBg})`,
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
    opacity: 0.5
  }

  $content = {
    position: 'relative',
    zIndex: 100
  }

  $viewName = {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#333',
    textAlign: 'center'
  }

  $wrap = {
    display: 'inline-block',
    padding: '8px 0 2px',
    margin: '0'
  }
}


styles = document.createElement('style');
styles.innerHTML = `
  /* Styles that give the Popover a look-and-feel. */

  .Popover-body {
    display: inline-flex;
    flex-direction: column;
    background-color: ${popoverBG};
    border-radius: 4px;
    border: 1px solid #DADADA;
    box-shadow: 0 0 22px rgba(0,0,0,0.1), 0 0 1px #fff inset;
    max-height: 600px;
    overflow-y: scroll;
  }

  .Popover-tipShape {
    fill: ${popoverBG};
  }
`;
document.head.appendChild(styles)
