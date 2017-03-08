// @flow
import Main from './main'
import React from 'react'
import ReactDOM from 'react-dom'

if (typeof Main === 'function') {
  ReactDOM.render(<Main />, document.getElementById('app'))
} else {
  console.error('No default view exported from the main file')
}

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept()
}
