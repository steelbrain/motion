import { isNumber, isBoolean } from 'lodash'

view Label {
  prop val, editable, onSet

  let input = null
  let focus, newVal

  on.props(() => {
    if (!focus) newVal = val
  })

  const onFocus = e => {
    if (!editable) return
    if (isBoolean(val)) return onSet(!val)
    focus = true
    e.stopPropagation()
  }

  const onBlur = e => {
    focus = false
  }

  const onChange = e => {
    newVal = e.target.value
    view.update({ immediate: true })

    if (isNumber(val)) {
      // dont let them change from num to str
      if (newVal === '' || isNaN(newVal)) return
    }

    // todo: debate
    if (newVal === 'false') newVal = false
    if (newVal === 'true') newVal = true
    onSet(newVal)
  }

  let tabIndex = editable => editable ? {} : {tabIndex: 5000, disabled: true}

  <input
    defaultValue={val.toString()}
    value={newVal}
    class={{ focus }}
    size={Math.max(4, val && val.length || 0)}
    spellCheck={false}
    onMouseDown={onFocus}
    onFocus={onFocus}
    onEnter={onBlur}
    {...tabIndex(editable)}
    {...{ onFocus, onBlur, onChange }}
  />

  $input = {
    position: 'absolute',
    top: 0,
    left: -1,
    right: 0,
    color: '#333',
    padding: 1,
    width: 140,
    outline: 'none',
    border: 'none',
    // nice cursor on boolean toggle
    cursor: isBoolean(val) ? 'pointer' : 'auto',
    opacity: 0,
    boxShadow: '1px 1px 2px rgba(0,0,0,0.4)'
  }

  $focus = {
    opacity: '1 !important',
  }
}
