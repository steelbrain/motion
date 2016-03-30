import ReactDOMServer from 'react-dom/server'
import ReactDOM from 'react-dom'
import React from 'react'
import ReactCreateElement from './lib/ReactCreateElement'
import Radium from './lib/radium'
import phash from './lib/phash'
import createElement from './tag/createElement'

const pathWithoutProps = path =>
  path.replace(/\.[a-z0-9\-]+$/, '')

let components = {}

export default function CreateComponent(Motion, Internal) {
  return (name, component, options = {}) => {
    let isChanged = options.changed

    // shim render to provide context aware Motion.createElement
    if (component.prototype.render) {
      let innerRender = component.prototype.render
      component.prototype.render = function() {
        // sets active component so createElement has access
        Motion.createElement.activeComponent = this
        let result = innerRender.call(this)
        Motion.createElement.activeComponent = null
        return result
      }
    }

    // create each type of component
    // TODO move radium below proxy?
    switch(options.type) {
      case Motion.viewTypes.CLASS:
        components[name] = Radium(component)
        break
      case Motion.viewTypes.FN:
        components[name] = Radium(createFnComponent())
        break
    }

    // production
    if (process.env.production)
      return components[name]

    // once rendered, isChanged is used to prevent
    // unnecessary props hashing, for faster hot reloads
    // TODO once?
    Motion.on('render:done', () => {
      isChanged = false
    })

    return createProxyComponent()

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

        render() {
          const View = components[name]

          let viewProps = Object.assign({}, this.props)

          viewProps.__motion = viewProps.__motion || {}
          viewProps.__motion.onMount = this.onMount
          viewProps.__motion.path = this.getPath()

          // FROM component
          // if (component.lastRendered)
          //   Internal.lastWorkingRenders[pathWithoutProps(path)] = lastRendered
          //
          // Internal.lastWorkingViews[name] = { component }

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
          let [ dom, style ] = component.call(null, component, this.getArgs())
          this.styles = style
          return dom
        }
      }

      let [ __motioninfo__, ...statics ] = Object.keys(component)

      // assign lifecycles and such
      for (let key of statics) {
        let val = component[key]
        component[key] = function() { return val(this.getArgs()) }
      }

      return React.createClass(component)
    }
  }
}
