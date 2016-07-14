'use babel'

/* @flow */

import style from '../lib/index'
import { it } from 'jasmine-fix'
import React from 'react'
import { mount } from 'enzyme'

@style()
class StyledComponent extends React.Component {
  static style = {
    h1: {
      background: 'red'
    },
    h2: {
      transform: {
        x: 0
      },
      border: [1, 'solid', '#ccc']
    },
    theme: {
      black: {
        h1: {
          background: 'black'
        }
      }
    }
  }

  render() {
    return (
      <div>
        <h1>Hello</h1>
        <h2>Hello</h2>
      </div>
    )
  }
}

describe('MotionStyle', () => {
  it('applies styles', () => {
    const el = mount(<StyledComponent />)

    const h1 = el.find('h1')
    const instance = el.component.getInstance()

    // has classname
    expect(!!h1.props().className).toBe(true)
    // matches stylesheet
    expect(h1.props().className).toBe(instance.styles.h1._name)
    // applies style
    expect(instance.styles.h1._definition.background).toBe('red')
  })

  it('applies complex styles', () => {
    const el = mount(<StyledComponent />)

    const instance = el.component.getInstance()

    // applies style
    expect(instance.styles.h2._definition.transform).toBe('translateX(0px)')
    expect(instance.styles.h2._definition.border).toBe('1px solid #ccc')
  })

  it('applies themes', () => {
    const el = mount(<StyledComponent theme="black" />)

    const instance = el.component.getInstance()

    // applies style
    // TODO test this better so its checking actual className match
    expect(instance.styles['black-h1']._definition.background).toBe('black')
  })
})
