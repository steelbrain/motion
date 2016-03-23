/* @flow */

const plugins = require('babel-preset-steelbrain').plugins

module.exports = {
  plugins: plugins.concat([
    [require('babel-plugin-transform-react-jsx'), {
      pragma: 'Motion.createElement'
    }],
    require('babel-plugin-transform-class-properties')
  ])
}
