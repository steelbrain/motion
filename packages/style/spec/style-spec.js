'use babel'

/* @flow */

import styler from '../lib/index'
import { it } from 'jasmine-fix'
import React from 'react'
import { mount } from 'enzyme'

const style = styler()

@style
class StyledComponent extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello</h1>
        <h2>Hello</h2>
      </div>
    )
  }

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

    const h2 = el.find('h2')
    const instance = el.component.getInstance()

    // applies style
    expect(instance.styles.h2._definition.transform).toBe('translateX(0px)')
    expect(instance.styles.h2._definition.border).toBe('1px solid #ccc')
  })

  it('applies themes', () => {
    const el = mount(<StyledComponent theme="black" />)

    const h1 = el.find('h1')
    const instance = el.component.getInstance()

    // applies style
    // TODO test this better so its checking actual className match
    expect(instance.styles['black-h1']._definition.background).toBe('black')
  })
})
