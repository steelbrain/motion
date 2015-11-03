import ReactDOMServer from 'react-dom/server'
import React from 'react'
import raf from 'raf'
// import Radium from 'radium'
import resolveStyles from 'flint-radium/lib/resolve-styles'

import hotCache from './mixins/hotCache'
import reportError from './lib/reportError'
import runEvents from './lib/runEvents'
import createElement from './tag/createElement'
import scopedOn from './lib/scopedOn'

const capitalize = str =>
  str[0].toUpperCase() + str.substring(1)

const pathWithoutProps = path =>
  path.replace(/\.[a-z0-9\-]+$/, '')

let views = {}

export default function createComponent(Flint, Internal, name, view, options = {}) {
  const el = createElement(name)

  if (process.env.production)
    return createViewComponent()

  if (options.changed) {
    views[name] = createViewComponent()
  }

  return createProxyComponent()

  // proxy components handle hot reloads
  function createProxyComponent() {
    return React.createClass({

      onMount(path, component, renderedEls) {
        Internal.mountedViews[name] = Internal.mountedViews[name] || []
        Internal.mountedViews[name].push(this)
        Internal.viewsAtPath[path] = this

        if (renderedEls)
          Internal.lastWorkingRenders[pathWithoutProps(path)] = renderedEls

        Internal.lastWorkingViews[name] = { component }
      },

      render() {
        const View = views[name]

        return (
          <View {...this.props} _flintOnMount={this.onMount} />
        )
      }
    })
  }

  // create view
  function createViewComponent() {
    const component = React.createClass({
      displayName: name,
      name,
      Flint,
      el,

      mixins: [hotCache({ Internal, options })],

      // TODO: shouldComponentUpdate based on hot load for perf
      shouldComponentUpdate() {
        return !this.isPaused
      },

      shouldReRender() {
        return (
          this._isMounted && !this.isUpdating &&
          !this.isPaused && !this.firstRender &&
          !this.isRendering
        )
      },

      // LIFECYCLES

      getInitialState() {
        this.setPath()

        let u = null

        this.successfulRender = null
        this.firstRender = true
        this.styles = { _static: {} }
        this.events = { mount: u, unmount: u, update: u, props: u }

        // scope on() to view
        this.viewOn = scopedOn(this)

        // cache Flint view render() (defined below)
        const flintRender = this.render

        this.renders = []

        // setter to capture view render
        this.render = renderFn => {
          this.renders.push(renderFn)
        }

        // call view
        if (process.env.production)
          view.call(this, this, this.viewOn, this.styles)
        else {
          // catch errors in view loop
          try {
            view.call(this, this, this.viewOn, this.styles)
          }
          catch(e) {
            console.error(e.stack)
            reportError(e)
          }
        }

        // reset original render
        this.render = flintRender

        return null
      },

      runEvents(name) {
        runEvents(this.events, name)
      },

      componentWillReceiveProps(nextProps) {
        this.props = nextProps
        this.runEvents('props')
      },

      componentDidMount() {
        this.isRendering = false
        this._isMounted = true
        this.runEvents('mount')

        if (!process.env.production) {
          this.props._flintOnMount(this.getPath(), this, this.lastRendered)
        }
      },

      componentWillUnmount() {
        // fixes unmount errors #60
        if (!process.env.production) {
          this.render()
        }

        this._isMounted = false
        this.runEvents('unmount')
      },

      componentWillMount() {
        // componentWillUpdate only run after first render
        this.runEvents('update')
        this.runEvents('props')
      },

      componentWillUpdate() {
        this.isUpdating = true
        this.runEvents('update')
      },

      componentDidUpdate() {
        this.isRendering = false
        this.isUpdating = false

        if (!process.env.production) {
          // set flintID for state inspect
          const node = ReactDOM.findDOMNode(this)
          if (node) node.__flintID = this.getPath()

          if (this.queuedUpdate) {
            this.isRendering = false
            this.update()
          }
        }
      },

      // FLINT HELPERS

      // helpers for controlling re-renders
      pause() { this.isPaused = true },
      resume() { this.isPaused = false },

      update() {
        if (!Internal.firstRender && !this.isRendering) {
          this.queuedUpdate = false
          raf(() => this.forceUpdate())
        }
        else {
          log(name, 'called update, isRendering still, queued?', this.queuedUpdate)
          if (!this.queuedUpdate)
            raf(() => this.update())

          this.queuedUpdate = true
        }
      },

      // helpers for context
      childContext(obj) {
        if (!obj) return

        Object.keys(obj).forEach(key => {
          this.constructor.childContextTypes[key] =
            React.PropTypes[typeof obj[key]]
        })

        this.getChildContext = () => obj
      },

      getWrapper(tags, props, numRenders) {
        const wrapperName = name.toLowerCase()

        let tagProps = Object.assign({
          isWrapper: true,
          ref: 'view'
        }, props)

        return this.el(`${wrapperName}`, tagProps, ...tags)
      },

      getRender() {
        let tags, props
        let addWrapper = true
        const numRenders = this.renders && this.renders.length

        if (!numRenders) {
          tags = []
          props = { yield: true }
        }

        else if (numRenders == 1) {
          tags = this.renders[0].call(this)

          addWrapper = (
            Array.isArray(tags) ||
            !tags.props
          )

          if (!Array.isArray(tags) && tags.props && tags.props.__tagName != name.toLowerCase()) {
            addWrapper = true
            tags = [tags]
          }
        }

        else if (numRenders > 1) {
          tags = this.renders.map(r => r.call(this))
        }

        // if $ = false, unwrap if possible
        if (this.styles._static && this.styles._static.$ == false && tags.length == 1) {
          addWrapper = false
          tags = tags[0]
        }

        // top level tag returned false
        if (!tags)
          addWrapper = true

        const wrappedTags = addWrapper ?
          this.getWrapper(tags, props, numRenders) :
          React.cloneElement(tags, { ref: 'view' })

        const styled = resolveStyles(this, wrappedTags)

        return styled
      },

      render() {
        this.isRendering = true
        this.firstRender = false

        if (process.env.production)
          return this.getRender()

        // try render
        try {
          const els = this.getRender()
          this.lastRendered = els
          return els
        }
        catch(e) {
          console.error(e.stack)
          reportError(e)

          const lastRender = Internal.lastWorkingRenders[pathWithoutProps(this.getPath())]

          try {
            let inner = <div>Error in view {name}</div>

            if (lastRender) {
              let __html = ReactDOMServer.renderToString(lastRender)
              inner = <div dangerouslySetInnerHTML={{ __html }} />
            }

            // highlight in red and return last working render
            return (
              <div style={{ position: 'relative' }}>
                <div id="FLINTERROR" />
                {inner}
              </div>
            )
          }
          catch(e) {
            log("Error rendering last version of view after error")
          }
        }
      }
    })

    return component
  }
}

function log(...args) {
  if (window.location.search == '?debug') console.log(...args)
}