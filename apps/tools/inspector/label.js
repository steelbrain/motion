import { isNumber, isBoolean, isString } from 'lodash'

view Label {
  prop val, editable, onSet
  prop valueStyle = {}
  prop editingStyle = {}
  prop nonEditingStyle = {}

  let input = null
  let newVal
  let editing = false

  on.props(() => {
    if (!editing && newVal !== val) {
      newVal = val
      view.update({ immediate: true })
    }
  })

  const onFocus = e => {
    if (!editable) return
    if (isBoolean(val)) return onSet(!val)
    editing = true
    e.stopPropagation()
  }

  const onBlur = e => {
    editing = false
  }

  const onChange = e => {
    newVal = e.target.value

    if (isNumber(val)) {
      // dont let them change from num to str
      if (newVal === '' || isNaN(newVal)) return
      newVal = +newVal
    }

    // todo: debate
    if (newVal === 'false') newVal = false
    if (newVal === 'true') newVal = true
    onSet(newVal)
    view.update({ immediate: true })
  }

  let tabIndex = editable => editable ? {} : {tabIndex: 5000, disabled: true}

  <input
    value={isString(newVal) ? newVal : newVal.toString()}
    class={{ editing }}
    size={Math.max(4, val && val.length || 0)}
    spellCheck={false}
    onMouseDown={onFocus}
    onFocus={onFocus}
    onEnter={onBlur}
    {...tabIndex(editable)}
    {...{ onFocus, onBlur, onChange }}
  />

  $input = [{
    color: '#333',
    padding: 1,
    width: 140,
    outline: 'none',
    border: 'none',
    // nice cursor on boolean toggle
    cursor: isBoolean(val) ? 'pointer' : 'auto',
    boxShadow: editing ? '1px 1px 2px rgba(0,0,0,0.4)' : undefined,
  }, valueStyle, editing ? editingStyle : nonEditingStyle]

  $editing = {
    opacity: '1 !important',
  }
}
