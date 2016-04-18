/* @flow */

const plugins = [
  require.resolve('babel-plugin-transform-decorators-legacy'),
  // React
  [require('babel-plugin-transform-react-jsx'), {
    pragma: 'Motion.createElement'
  }],
  require('babel-plugin-transform-flow-strip-types'),
  require('babel-plugin-syntax-flow'),
  require('babel-plugin-syntax-jsx'),
  require('babel-plugin-transform-react-display-name')
]

module.exports = {
  presets: [
    require.resolve('babel-preset-es2015'), require.resolve('babel-preset-stage-0')
  ],
  plugins
}
