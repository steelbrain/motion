/* @flow */

if (module.hot) {
  module.hot.accept()
}
import Motion from 'react'
import MotionDOM from 'react-dom'
import MainView from '$rootDirectory/index.js'
console.log('[Motion] Welcome to motion')
MotionDOM.render(Motion.createElement(MainView), document.getElementById('app'))
