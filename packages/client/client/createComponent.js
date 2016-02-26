import ReactDOMServer from 'react-dom/server'
import ReactDOM from 'react-dom'
import React from 'react'
import raf from 'raf'
import ReactCreateElement from './lib/ReactCreateElement'
import Radium from './lib/radium'

import phash from './lib/phash'
import cloneError from './lib/cloneError'
import hotCache from './mixins/hotCache'
import reportError from './lib/reportError'
import createElement from './tag/createElement'
import viewOn from './lib/viewOn'

const capitalize = str =>
  str[0].toUpperCase() + str.substring(1)

const pathWithoutProps = path =>
  path.replace(/\.[a-z0-9\-]+$/, '')

let views = {}
let viewErrorDebouncers = {}

export default function CreateComponent(Motion, Internal) {
  return (name, view, options = {}) => {
    let isChanged = options.changed

    // wrap decorators
    const wrapComponent = (component) => {
      if (Internal.viewDecorator[name])
        component = Internal.viewDecorator[name](component)
      if (Internal.viewDecorator.all)
        component = Internal.viewDecorator.all(component)
      return component
    }

    // shim render to provide context aware Motion.createElement
    if (view.prototype.render) {
      let innerRender = view.prototype.render
      view.prototype.render = function() {
        // sets active component so createElement has access
        Motion.createElement.activeComponent = this
        let result = innerRender.call(this)
        Motion.createElement.activeComponent = null
        return result
      }
    }

    // create each type of view
    // TODO move radium below proxy?
    switch(options.type) {
      case Motion.viewTypes.CLASS:
        views[name] = Radium(view)
        break
      case Motion.viewTypes.FN:
        views[name] = Radium(createFnComponent())
        break
    }

    // production
    if (process.env.production)
      return wrapComponent(views[name])

    // once rendered, isChanged is used to prevent
    // unnecessary props hashing, for faster hot reloads
    // TODO once?
    Motion.on('render:done', () => {
      isChanged = false
    })

    return wrapComponent(createProxyComponent())

    // proxy components handle hot reloads
    function createProxyComponent() {
      return React.createClass({

        displayName: `${name}Proxy`,

        childContextTypes: {
          path: React.PropTypes.string,
          displayName: React.PropTypes.string
        },

        contextTypes: {
          path: React.PropTypes.string
        },

        getChildContext() {
          return {
            path: this.getPath()
          }
        },

        getPath() {
          if (!this.path) this.setPath()
          return this.path
        },

        getSep() {
          return name == 'Main' ? '' : ','
        },

        setPathKey() {
          const motion = this.props.__motion
          const key = motion && motion.key || '00'
          const index = motion && motion.index || '00'
          const parentPath = this.context.path || ''
          this.pathKey = `${parentPath}${this.getSep()}${name}-${key}/${index}`
        },

        setPath() {
          this.setPathKey()

          if (!isChanged) {
            const prevPath = Internal.paths[this.pathKey]
            if (prevPath) {
              this.path = prevPath
              return
            }
          }

          const propsHash = phash(this.props)
          this.path = `${this.pathKey}.${propsHash}`

          // for faster retrieval hot reloading
          Internal.paths[this.pathKey] = this.path
        },

        componentDidMount() {
          if (options.isView) return

          Internal.mountedViews[name] = Internal.mountedViews[name] || []
          Internal.mountedViews[name].push(this)
          Internal.viewsAtPath[this.getPath()] = this
        },

        componentWillUnmount() {
          // TODO remove from mounted views
        },

        onMount(component) {
          const path = this.getPath()
          const lastRendered = component.lastRendered

          Internal.mountedViews[name] = Internal.mountedViews[name] || []
          Internal.mountedViews[name].push(this)
          Internal.viewsAtPath[path] = component

          if (lastRendered)
            Internal.lastWorkingRenders[pathWithoutProps(path)] = lastRendered

          Internal.lastWorkingViews[name] = { component }
        },

        render() {
          const View = views[name]

          let viewProps = Object.assign({}, this.props)

          viewProps.__motion = viewProps.__motion || {}
          viewProps.__motion.onMount = this.onMount
          viewProps.__motion.path = this.getPath()

          return ReactCreateElement(View, viewProps)
        }
      })
    }


    // for regular function style components
    function createFnComponent() {
      let component = {
        renders: [], // TODO remove this, fix bugs
        name,
        displayName: name,
        Motion,
        el: createElement,

        getArgs() {
          let args = {
            props: this.props,
            update: this.setState.bind(this)
          }

          if (this.state)
            args.state = this.state

          return args
        },

        render() {
          let [ dom, style ] = view.call(null, component, this.getArgs())
          this.styles = style
          return dom
        }
      }

      let [ __motioninfo__, ...statics ] = Object.keys(view)

      // assign lifecycles and such
      for (let key of statics) {
        let val = view[key]
        component[key] = function() { return val(this.getArgs()) }
      }

      return React.createClass(component)
    }
  }
}
