// @flow
import 'react-hot-loader/patch'
import Main from './main'
import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'

if (process.env.NODE_ENV === 'development') {
  if (typeof Main === 'function') {
    ReactDOM.render(
      <AppContainer>
        <Main />
      </AppContainer>,
      document.getElementById('app')
    )
  } else {
    console.error('No default view exported from the main file')
  }

  if (process.env.NODE_ENV === 'development' && module.hot) {
    module.hot.accept()
  }
}
else {
  ReactDOM.render(<Main />, document.getElementById('app'))
}
