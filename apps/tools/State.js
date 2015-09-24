const notBaseProp = name => ['style', 'children'].indexOf(name) == -1

const getState = () => {
  const f = window.Flint
  const viewState = Object.keys(f.activeViews).map(id => {
    return {
      title: f.activeViews[id].name,
      props: Object.keys(f.activeViews[id].props).filter(notBaseProp).map(key => ({
        label: key, value: f.activeViews[id].props[key]
      })),
      vars: Object.keys(f.values[id]).map(key => ({
        label: key, value: f.values[id][key]
      }))
    }
  })

  const storeState = Object.keys(f.stores).map(store => ({
    title: store,
    vars: Object.keys(f.values[store]).map(key => ({
      label: key, value: f.values[store][key]
    }))
  }))

  return viewState.concat(storeState)
}

view State {
  let state = []

  listen = () => {
    state = getState()
    window.Flint.on("newSnapshot", () => state = getState())
  }

  setTimeout(listen, 100)

  <view repeat={state}>
    <Header title={_title} />
    <Var name={'[prop] ' + _label} value={_value} repeat={_props} />
    <empty if={_props.length ==0}>no props</empty>

    <Var name={_label} value={_value} repeat={_vars} />
    <empty if={_vars.length ==0}>no state</empty>
  </view>


  $empty = {
    padding: [0, 10],
    marginTop: 10,
    font: "1em/1 Consolas, monospace",
    cursor: "pointer",
  }
  $ = {
    overflowY: 'scroll',
    position: 'fixed',
    display: 'block',
    right: ^hide ? -280 : 0,
    top: 0, bottom: 0,
    width: 280,
    borderLeft: '1px solid #ccc',
    background: 'white',
    transition: 'all ease-in 100ms',
    zIndex: 2147483647
  }

  $Var = { marginTop: 5 }
  $view = {
    maxHeight: 500,
    flexFlow: 'column',
    display: 'flex'
  }
}

view Var {
  const isObject = v => (!!v) && (v.constructor === Object)
  const isArray = v => (!!v) && (v.constructor === Array)
  const isComplex = v => isObject(v) || isArray(v)
  const toggle = () => {
    if (isComplex(^value)) open = !open
  }

  let open = false

  <top>
    <name onClick = {toggle}>{^name}:</name>
    <value>
      <State.Tree value = {^value}
                  open = {open}
                  onToggle :: {open = !open} />
    </value>
  </top>
  <State.TreeDetail value={^value} if={open} />

  $ = {
    padding: [0, 10],
    font: "1em/1 Consolas, monospace",
    cursor: "pointer",
    flexFlow: 'column',
  }

  $top = {
    flexFlow: 'row',
  }

  $variable = {
    flexFlow: 'row',
  }

  $name = {
    flexFlow: 'row',
    userSelect: 'none',
    font: "1em/1 Consolas, monospace",
    height: 30,
    color: 'rgba(0, 0, 0, .7)'
  }

  $value = {
    marginLeft: 10
  }
}

view Header {
  <label>{^title}</label>

  $ = {
    flexShrink: 0,
    borderTop: '1px solid #ccc',
    borderBottom: '1px solid #ccc',
  }

  $label = {
    color: 'rgba(0,0,0,.5)',
    background: '#fafafa',
    fontWeight: 800,
    fontSize: 14,
    padding: [7, 10],
  }
}
