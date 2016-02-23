import { init } from './state'
import helpersInit from './lib/helpers'
import Program from './nodes/Program'
import ExportDeclaration from './nodes/ExportDeclaration'
import ImportDeclaration from './nodes/ImportDeclaration'
import ViewStatement from './nodes/ViewStatement'
import Statement from './nodes/Statement'
import JSXElement from './nodes/JSXElement'
import JSXAttribute from './nodes/JSXAttribute'
import ArrowFunctionExpression from './nodes/ArrowFunctionExpression'
import FunctionExpression from './nodes/FunctionExpression'
import FunctionDeclaration from './nodes/FunctionDeclaration'
import ReturnStatement from './nodes/ReturnStatement'
import CallExpression from './nodes/CallExpression'
import VariableDeclaration from './nodes/VariableDeclaration'
import AssignmentExpression from './nodes/AssignmentExpression'
import UpdateExpression from './nodes/UpdateExpression'
import ClassDeclaration from './nodes/ClassDeclaration'

export default function createPlugin(options) {
  // running without options
  if (options.Transformer) return MotionPlugin(options)

  // plugin
  function MotionPlugin({ Plugin, types: t }) {

    // init
    init()
    helpersInit(options, t)

    return new Plugin('motion-transform', {
      metadata: { group: 'builtin-trailing' },
      visitor: {
        Program,
        ExportDeclaration,
        ImportDeclaration,
        ViewStatement,
        Statement,
        JSXElement,
        JSXAttribute,
        ArrowFunctionExpression,
        FunctionExpression,
        FunctionDeclaration,
        ReturnStatement,
        CallExpression,
        VariableDeclaration,
        AssignmentExpression,
        UpdateExpression,
        ClassDeclaration
      }
    })
  }

  return MotionPlugin
}