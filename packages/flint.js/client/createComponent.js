import ReactDOMServer from 'react-dom/server'
import ReactDOM from 'react-dom'
import React from 'react'
import raf from 'raf'
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

export default function createComponent(Flint, Internal, name, view, options = {}) {
  let isChanged = options.changed

  // wrap decorators
  const wrapComponent = (component) => {
    if (Internal.viewDecorator[name])
      component = Internal.viewDecorator[name](component)
    if (Internal.viewDecorator.all)
      component = Internal.viewDecorator.all(component)
    return component
  }

  // production
  if (process.env.production)
    return wrapComponent(createViewComponent())

  // development
  views[name] = createViewComponent()

  // once rendered, isChanged is used to prevent
  // unnecessary props hashing, for faster hot reloads
  Flint.on('render:done', () => {
    isChanged = false
  })

  return wrapComponent(createProxyComponent())

  // proxy components handle hot reloads
  function createProxyComponent() {
    return React.createClass({

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
        const flint = this.props.__flint
        const key = flint && flint.key || '00'
        const index = flint && flint.index || '00'
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

        viewProps.__flint = viewProps.__flint || {}
        viewProps.__flint.onMount = this.onMount
        viewProps.__flint.path = this.getPath()

        return React.createElement(View, viewProps)
      }
    })
  }

  // create view
  function createViewComponent() {
    const component = React.createClass({
      displayName: name,
      name,
      Flint,
      el: createElement,

      // set() get() dec()
      mixins: [hotCache({ Internal, options, name })],

      // TODO: shouldComponentUpdate based on hot load for perf
      shouldComponentUpdate() {
        return !this.isPaused
      },

      shouldUpdate(fn) {
        if (this.hasShouldUpdate) {
          reportError({ message: `You defined shouldUpdate twice in ${name}, remove one!`, fileName: `view ${name}` })
          return
        }

        this.hasShouldUpdate = true

        const flintShouldUpdate = this.shouldComponentUpdate.bind(this)

        this.shouldComponentUpdate = (nextProps) => {
          if (!flintShouldUpdate()) return false
          return fn(this.props, nextProps)
        }
      },

      // LIFECYCLES

      getInitialState() {
        const fprops = this.props.__flint

        Internal.getInitialStates[fprops ? fprops.path : 'Main'] = () => this.getInitialState()

        let u = null

        this.state = {}
        this.propDefaults = {}
        this.queuedUpdate = false
        this.firstRender = true
        this.styles = {}
        this.events = { mount: u, unmount: u, change: u, props: u }
        this.path = null

        // scope on() to view
        this.on = viewOn(this)

        // cache Flint view render() (defined below)
        const flintRender = this.render

        this.renders = []

        // setter to capture view render
        this.render = renderFn => {
          this.renders.push(renderFn)
        }

        if (process.env.production)
          view.call(this, this, this.on, this.styles)
        else {
          try {
            view.call(this, this, this.on, this.styles)
            this.recoveryRender = false
          }
          catch(e) {
            Internal.caughtRuntimeErrors++
            reportError(e)
            console.error(e.stack || e)
            this.recoveryRender = true
          }
        }

        // reset original render
        this.render = flintRender

        // Flint._onViewInstance
        if (Internal.instanceDecorator[name])
          Internal.instanceDecorator[name](this)
        if (Internal.instanceDecorator.all)
          Internal.instanceDecorator.all(this)

        return null
      },

      runEvents(name, args) {
        const queue = this.events

        if (queue[name] && queue[name].length) {
          queue[name].forEach(event => {
            event.apply(this, args)
          })
        }
      },

      componentWillReceiveProps(nextProps) {
        // set timeout becuase otherwise props is mutated before shouldUpdate is run
        // setTimeout(() => {

        // main doesnt get props
        if (name != 'Main') {
          this.props = nextProps
          this.runEvents('props', [this.props])
        }

        if (!process.env.production) {
          const path = nextProps.__flint.path
          const fn = Internal.inspector[path]
          const state = _Flint.getCache[nextProps.__flint.path]
          // send to inspector if inspecting
          fn && fn(nextProps, state)
        }


        // })
      },

      componentWillMount() {
        // run props before mount
        if (name != 'Main') {
          this.runEvents('props', [this.props])
        }
        else {
          // moved to here to fix issues where updating during first mount fails
          //    see: https://github.com/flintjs/flint/issues/305
          Internal.firstRender = false
        }
      },

      componentDidMount() {
        this.isRendering = false
        this.mounted = true

        this.runEvents('mount')

        if (this.queuedUpdate) {
          this.queuedUpdate = false
          this.update()
        }

        if (!process.env.production) {
          this.props.__flint.onMount(this)
          this.setID()
        }

        if (this.doRenderToRoot) {
          this.handleRootRender()
        }
      },

      componentWillUnmount() {
        this.runEvents('unmount')
        this.mounted = false

        // fixes unmount errors github.com/flintjs/flint/issues/60
        if (!process.env.production) this.render()

        if (this.doRenderToRoot) {
          ReactDOM.unmountComponentAtNode(this.node)
          this.app.removeChild(this.node)
        }
      },

      componentWillUpdate() {
        this.runEvents('change')
      },

      setID() {
        if (Internal.isDevTools) return

        // set flintID for state inspect
        const node = ReactDOM.findDOMNode(this)
        if (node) node.__flintID = this.props.__flint.path
      },

      componentDidUpdate() {
        this.isRendering = false

        if (this.queuedUpdate) {
          this.queuedUpdate = false
          this.update()
        }

        if (!process.env.production) {
          this.setID()
        }

        if (this.doRenderToRoot) {
          this.handleRootRender()
        }
      },

      // FLINT HELPERS
      // view.element('foo') -> <foo>
      element(selector) {
        const viewNode = ReactDOM.findDOMNode(this)

        // Returns itself if a selector is not specified
        if (!selector) return viewNode
        return viewNode.querySelector(selector)
      },

      elements(selector) {
        const els = ReactDOM.findDOMNode(this).querySelectorAll(selector)
        return Array.prototype.slice.call(els, 0)
      },

      // property declarators
      getProp(name) {
        return typeof this.props[name] === 'undefined' ?
               this.propDefaults[name] :
               this.props[name]
      },

      prop(name, defaultValue) {
        this.propDefaults[name] = defaultValue
        return this.getProp(name)
      },

      clone(el, props) {
        // TODO better checks and warnings, ie if they dont pass in element just props
        if (!el) return el
        if (typeof el !== 'object')
          throw new Error(`You're attempting to clone something that isn't a tag! In view ${this.name}. Attempted to clone: ${el}`)

        // move the parent styles source to the cloned view
        if (el.props && el.props.__flint) {
          let fprops = el.props.__flint

          fprops.parentName = this.name
          fprops.parentStyles = this.styles
        }

        // ok so there was a bug with cloning a view that removes all the view root nodes classes
        // this works around it
        // TODO this should only be done when dealing with flint views, avoid this for tags
        if (props.class || props.className) {
          props.__flintAddClass = props.class || props.className
          delete props.class
          delete props.className
        }

        return React.cloneElement(el, props)
      },

      mapElements(children, cb) {
        return React.Children.map(children, cb)
      },

      getName(child) {
        const name = child.props && child.props.__flint && child.props.__flint.tagName

        // TODO does this always work, what about with react components
        return name
      },

      // helpers for controlling re-renders
      pause() { this.isPaused = true },
      resume() { this.isPaused = false },

      // for looping while waiting
      delayUpdate() {
        if (this.queuedUpdate) return
        this.queuedUpdate = true
        this.update()
      },

      updateSoft() {
        this.update(true)
      },

      // view.set()
      update(soft) {
        // view.set respects paused
        if (soft && this.isPaused) return

        // if during a render, wait
        if (!this.mounted || Internal.firstRender) {
          this.queuedUpdate = true
          return
        }

        // during render, dont update
        if (this.isRendering) return

        // tools run into weird bug where if error in app on initial render, react gets
        // mad that you are trying to re-render tools during app render TODO: strip in prod
        // check for isRendering so it shows if fails to render
        if (!process.env.production && _Flint.firstRender && _Flint.isRendering)
          return setTimeout(this.update)

        this.queuedUpdate = false

        // rather than setState because we want to skip shouldUpdate calls
        this.forceUpdate()
      },

      // childContextTypes: {
      //   flintContext: React.PropTypes.object
      // },
      //
      // contextTypes: {
      //   flintContext: React.PropTypes.object
      // },
      //
      // getChildContext() {
      //   console.log(name, 'get', this)
      //   return { flintContext: this._context || null }
      // },
      //
      // // helpers for context
      // setContext(obj) {
      //   if (typeof obj != 'object')
      //     throw new Error('Must pass an object to childContext!')
      //
      //   console.log(this, name, 'set', obj)
      //   this.state = { _context: obj }
      // },

      // render to a "portal"
      renderToRoot() {
        this.doRenderToRoot = true

        this.app = document.body
        this.node = document.createElement('div')
        this.node.setAttribute('data-portal', 'true')
        this.app.appendChild(this.node)
      },

      inlineStyles() {
        this.doRenderInlineStyles = true
      },

      handleRootRender() {
        ReactDOM.render(this.renderResult, this.node)
      },

      getWrapper(tags, props, numRenders) {
        const wrapperName = name.toLowerCase()

        let tagProps = Object.assign({ __flintIsWrapper: true }, props)

        return this.el(`view.${name}`, tagProps, ...tags)
      },

      getRender() {
        if (this.recoveryRender)
          return this.getLastGoodRender()

        let tags, props
        let addWrapper = true
        const numRenders = this.renders && this.renders.length

        // no root elements
        if (!numRenders) {
          tags = []
          props = { yield: true }
        }
        // one root element
        else if (numRenders == 1) {
          tags = this.renders[0].call(this)
          const hasMultipleTags = Array.isArray(tags)
          addWrapper = hasMultipleTags || !tags.props

          if (!hasMultipleTags && tags.props && !tags.props.root) {
            // if tag name == view name
            if (tags.props.__flint && tags.props.__flint.tagName != name.toLowerCase()) {
              addWrapper = true
              tags = [tags]
            }
          }
        }
        // multiple root elements
        else if (numRenders > 1) {
          tags = this.renders.map(r => r.call(this))
        }

        const wrappedTags = addWrapper ? this.getWrapper(tags, props, numRenders) : tags

        const cleanName = name.replace('.', '-')
        const viewClassName = `View${cleanName}`
        const parentClassName = wrappedTags.props.className
        const withParentClass = parentClassName
          ? `${viewClassName} ${parentClassName}`
          : viewClassName

        // view.clone (see above) avoids mutating classname until here
        // fixes bug: if view.clone(Child, { className: xyz }), would overwrite classes in Child
        let clonedClass
        if (wrappedTags.props.__flintAddClass) {
          clonedClass = `${withParentClass} ${wrappedTags.props.__flintAddClass}`
        }

        const className = clonedClass || withParentClass
        const withClass = React.cloneElement(wrappedTags, { className })
        return withClass
      },

      getLastGoodRender() {
        return Internal.lastWorkingRenders[pathWithoutProps(this.props.__flint.path)]
      },

      // TODO once this works better in 0.15
      // unstable_handleError(e) {
      //   console.log('ERR', e)
      //   reportError(e)
      // },

      _render() {
        const self = this

        self.isRendering = true
        self.firstRender = false

        if (process.env.production)
          return self.getRender()
        else {
          clearTimeout(viewErrorDebouncers[self.props.__flint.path])
        }

        // try render
        try {
          const els = self.getRender()
          self.lastRendered = els
          return els
        }
        catch(e) {
          Internal.caughtRuntimeErrors++

          const err = cloneError(e)
          const errorDelay = Internal.isLive() ? 1000 : 200

          // console warn, with debounce
          viewErrorDebouncers[self.props.__flint.path] = setTimeout(() => {
            console.groupCollapsed(`Render error in view ${name} (${err.message})`)
            console.error(err.stack || err)
            console.groupEnd()

            // if not in debouncer it shows even after fixing
            reportError(e)
          }, errorDelay)

          const lastRender = self.getLastGoodRender()

          try {
            let inner = <span>Error in view {name}</span>

            if (Internal.isDevTools)
              return inner

            if (lastRender) {
              let __html = ReactDOMServer.renderToString(lastRender)
              __html = __html.replace(/\s*data\-react[a-z-]*\=\"[^"]*\"/g, '')
              inner = <span dangerouslySetInnerHTML={{ __html }} />
            }

            // highlight in red and return last working render
            return (
              <span style={{ display: 'block', position: 'relative' }}>
                <span className="__flintError" />
                {inner}
              </span>
            )
          }
          catch(e) {
            console.log("Error rendering last version of view after error")
          }
        }
      },

      render() {
        let result = this._render.call(this)

        if (this.doRenderToRoot) {
          this.renderResult = result
          return <noscript />
        }
        else {
          return result
        }
      }
    })

    return Radium(component)
  }
}
