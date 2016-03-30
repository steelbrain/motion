import { init } from './state'
import helpersInit from './lib/helpers'
import Program from './nodes/Program'
import Statement from './nodes/Statement'
import JSXElement from './nodes/JSXElement'
import JSXAttribute from './nodes/JSXAttribute'
import ArrowFunctionExpression from './nodes/ArrowFunctionExpression'
import ReturnStatement from './nodes/ReturnStatement'
import ExportDeclaration from './nodes/ExportDeclaration'
import ImportDeclaration from './nodes/ImportDeclaration'
import CallExpression from './nodes/CallExpression'
import VariableDeclaration from './nodes/VariableDeclaration'
import AssignmentExpression from './nodes/AssignmentExpression'
import ClassDeclaration from './nodes/ClassDeclaration'

export default function createPlugin(options) {
  // running without options
  if (options.Transformer)
    return MotionPlugin(options)

  // plugin
  return function MotionPlugin({ types: t }) {

    // init
    init()
    helpersInit(options, t)

    return {
      visitor: {
        Program,
        ExportDeclaration,
        ImportDeclaration,
        Statement,
        JSXElement,
        JSXAttribute,
        ArrowFunctionExpression,
        ReturnStatement,
        CallExpression,
        VariableDeclaration,
        AssignmentExpression,
        ClassDeclaration
      }
    }
  }
}
