/* @flow */

if (module.hot) {
  module.hot.accept()
}
import Motion from 'react'
import MotionDOM from 'react-dom'
import MainView from '$/index.js'

if (typeof MainView === 'function') {
  MotionDOM.render(Motion.createElement(MainView), document.getElementById('app'))
} else {
  console.error('No default view exported from the main file')
}
