'use babel'

import style from '../lib/index'
import React from 'react'

@style()
export default class BasicComponent extends React.Component {
  static style = {
    h1: {
      background: 'red'
    }
  }

  render() {
    return <h1>Hello</h1>
  }
}
