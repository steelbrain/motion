/* @flow */

module.exports = {
  presets: [
    require.resolve('babel-preset-es2015'), require.resolve('babel-preset-stage-0'), require.resolve('babel-preset-react')
  ],
  plugins: [
    require.resolve('babel-plugin-transform-decorators-legacy')
  ]
}
