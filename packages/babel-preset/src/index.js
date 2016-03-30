/* @flow */

// const motionTransform = require('motion-transform')

const plugins = [
  // ES2015
  require('babel-plugin-transform-es2015-template-literals'),
  require('babel-plugin-transform-es2015-literals'),
  require('babel-plugin-transform-es2015-function-name'),
  require('babel-plugin-transform-es2015-arrow-functions'),
  require('babel-plugin-transform-es2015-block-scoped-functions'),
  // Commented out because it conflicts with flow types and produces 'Missing class properties transform' error
  // require('babel-plugin-transform-es2015-classes'),
  require('babel-plugin-transform-es2015-object-super'),
  require('babel-plugin-transform-es2015-shorthand-properties'),
  require('babel-plugin-transform-es2015-duplicate-keys'),
  require('babel-plugin-transform-es2015-computed-properties'),
  require('babel-plugin-transform-es2015-for-of'),
  require('babel-plugin-transform-es2015-sticky-regex'),
  require('babel-plugin-transform-es2015-unicode-regex'),
  require('babel-plugin-check-es2015-constants'),
  require('babel-plugin-transform-es2015-spread'),
  require('babel-plugin-transform-es2015-parameters'),
  require('babel-plugin-transform-es2015-destructuring'),
  require('babel-plugin-transform-es2015-block-scoping'),
  require('babel-plugin-transform-es2015-typeof-symbol'),
  require('babel-plugin-transform-es2015-modules-commonjs'),
  require('babel-plugin-transform-class-properties'),

  // Personal
  require('babel-plugin-syntax-async-functions'),
  require('babel-plugin-syntax-async-generators'),
  require('babel-plugin-transform-async-to-generator'),

  // React
  [require('babel-plugin-transform-react-jsx'), {
    pragma: 'Motion.createElement'
  }],
  require('babel-plugin-transform-flow-strip-types'),
  require('babel-plugin-syntax-flow'),
  require('babel-plugin-syntax-jsx'),
  require('babel-plugin-transform-react-display-name'),

  // Motion
  // motionTransform.file({})
]

module.exports = {
  plugins
}
