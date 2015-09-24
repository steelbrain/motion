import Popover from 'react-popover';
import React, { render, unmountComponentAtNode, createElement, createClass, DOM as e, PropTypes as t } from 'react';
import * as resizeEvent from './popoverOnResize'

let merge = Object.assign;
let flipDirection = {
  left: 'Right',
  right: 'Left',
  top: 'Bottom',
  bottom: 'Top'
}

// window.Popover = Popover;

export function calcBounds (el) {
  if (el === window) {
    return {
      x: 0,
      y: 0,
      x2: el.innerWidth,
      y2: el.innerHeight,
      w: el.innerWidth,
      h: el.innerHeight
    }
  }

  let b = el.getBoundingClientRect()

  return {
    x: b.left,
    y: b.top,
    x2: b.right,
    y2: b.bottom,
    w: b.right - b.left,
    h: b.bottom - b.top
  }
}

export function calcScrollSize (el) {
  return el === window
    ? { w: el.scrollX, h: el.scrollY }
    : { w: el.scrollLeft, h: el.scrollTop }
}


let coreStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex'
}

let faces = { above: 'down', right: 'left', below: 'up', left: 'right' }

let tipTranslateFuncDict = { row: 'translateY', column: 'translateX' }
let popoverTranslateFuncDict = { row: 'translateX', column: 'translateY' }

/* Axes system. This allows us to at-will work in a different orientation
without having to manually keep track of knowing if we should be using
x or y positions. */

let axes = {}

axes.row = {
  main: { start: 'x', end: 'x2', size: 'w' },
  cross: { start: 'y', end: 'y2', size: 'h' }
}

axes.column = {
  main: axes.row.cross,
  cross: axes.row.main
}


window.Popover = React.createClass({
  name: 'popover',
  mixins: [ReactLayerMixin()],
  getInitialState() {
    return {
      standing: 'above',
      exited: true, // for animation-dependent rendering, should popover close/open?
      exiting: false, // for tracking in-progress animations
      toggle: false // for business logic tracking, should popover close/open?
    }
  },
  getDefaultProps() {
    return {
      tipSize: 10,
      offset: 4,
      isOpen: false,
      onOuterAction: function noOperation(){},
      enterExitTransitionDurationMs: 500
    }
  },
  checkTargetReposition() {
    if (this.measureTargetBounds()) this.resolvePopoverLayout()
  },
  resolvePopoverLayout() {

    let pos = { }

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let zone = pickZone(this.p2, this.size, this.frameBounds)
    this.zone = zone

    this.setState({
      standing: zone.standing
    })

    let axis = axes[zone.flow]

    let popoverMainLength = this.size[axis.main.size]
    let dockingEdgeBufferLength = Math.round(getComputedStyle(this.bodyEl).borderRadius.slice(0, -2)) || 0
    let targetMainStart = this.p2[axis.main.start]
    let targetMainEnd = this.p2[axis.main.end]
    let scrollSize = calcScrollSize(this.frameEl)
    scrollSize.main = scrollSize[axis.main.size]
    scrollSize.cross = scrollSize[axis.cross.size]

    /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
    this is thus: First position cross-axis self to the cross-axis-center of the the target. Then,
    offset self by the amount that self is past the boundaries of frame. */

    pos[axis.main.start] = (

      /* Unfortunately we cannot seem to get around the base fact that layout expands in a direction
      which happens to be leftward, and thus in the before-case requires an extra step of offsetting
      all the leftware-expansion (AKA the length of the element). TODO: We could potentially have
      helper functions like positionBefore / after etc. to abstract this complexity away. */
      (zone.order === -1 ? targetMainStart - popoverMainLength : targetMainEnd)

      // offset allows users to control the distance betweent the tip and the target.
      + (this.props.offset * zone.order)
    )
    let popoverRelativeCrossStart = (
      center('cross', zone.flow, this.p2)
      - (this.size[axis.cross.size] / 2)
    )
    pos[axis.cross.start] = (
      popoverRelativeCrossStart
    )
    pos.x2 = pos.x + this.size.w
    pos.y2 = pos.y + this.size.h
    pos.mainLength = this.size[axis.main.size]
    pos.crossLength = this.size[axis.cross.size]

    /* Constrain containerEl Position within frameEl. Try not to penetrate a visually-pleasing buffer from
    frameEl. `frameBuffer` length is based on tipSize and its offset. */

    let frameBuffer = this.props.tipSize + this.props.offset
    let hangingBufferLength = (dockingEdgeBufferLength * 2) + (this.props.tipSize * 2) + frameBuffer
    let frameCrossStart = this.frameBounds[axis.cross.start]
    let frameCrossEnd = this.frameBounds[axis.cross.end]
    let frameCrossLength = this.frameBounds[axis.cross.size]
    let frameCrossInnerLength = frameCrossLength - frameBuffer * 2
    let frameCrossInnerStart = frameCrossStart + frameBuffer
    let frameCrossInnerEnd = frameCrossEnd - frameBuffer
    let popoverCrossStart = pos[axis.cross.start]
    let popoverCrossEnd = pos[axis.cross.end]

    /* If the popover dose not fit into frameCrossLength then just position it to the `frameCrossStart`.
    `popoverCrossLength` will now be forced to overflow into the `Frame` */
    if (pos.crossLength > frameCrossLength) {
      pos[axis.cross.start] = 0

    /* If the `popoverCrossStart` is forced beyond some threshold of `targetCrossLength` then bound
    it (`popoverCrossStart`). */

    } else if (this.p2[axis.cross.end] < hangingBufferLength) {
      pos[axis.cross.start] = this.p2[axis.cross.end] - hangingBufferLength

    /* If the `popoverCrossStart` does not fit within the inner frame (honouring buffers) then
    just center the popover in the remaining `frameCrossLength`. */

    } else if (pos.crossLength > frameCrossInnerLength) {
      pos[axis.cross.start] = (frameCrossLength - pos.crossLength) / 2

    } else if (popoverCrossStart < frameCrossInnerStart) {
      pos[axis.cross.start] = frameCrossInnerStart

    } else if (popoverCrossEnd > frameCrossInnerEnd) {
      pos[axis.cross.start] = pos[axis.cross.start] - (pos[axis.cross.end] - frameCrossInnerEnd)
    }

    /* So far all positioning has only been relative. Before setting the final position
    we need to account for the `Frame`'s scroll position. */

    pos[axis.cross.start] += scrollSize.cross
    pos[axis.main.start] += scrollSize.main

    /* Apply `flow` and `order` styles. This can impact subsequent measurements of height and width
    of the container. When tip changes orientation position due to changes from/to `row`/`column`
    width`/`height` will be impacted. Our layout monitoring will catch these cases and automatically
    recalculate layout. */

    this.containerEl.style.flexFlow = zone.flow
    this.bodyEl.style.order = zone.order

    /* Apply Absolute Positioning. */

    this.containerEl.style.top = `${pos.y}px`
    this.containerEl.style.left = `${pos.x}px`

    /* Calculate Tip Center */

    let tipCrossPos = (

      /* Get the absolute tipCrossCenter */
      center('cross', zone.flow, this.p2) + scrollSize.cross

      /* Center tip relative to self. We do not have to calcualte half-of-tip-size since tip-size
      specifies the length from base to tip which is half of total length already. */

      - this.props.tipSize

      /* Tip is positioned relative to containerEl but it aims at targetCenter
      which is positioned relative to frameEl... we need to cancel the containerEl
      positioning so as to hit our intended position. */

      - pos[axis.cross.start]
    )

    if (tipCrossPos < dockingEdgeBufferLength)
      tipCrossPos = dockingEdgeBufferLength
    else if (tipCrossPos > (pos.crossLength - dockingEdgeBufferLength) - this.props.tipSize * 2)
      tipCrossPos = (pos.crossLength - dockingEdgeBufferLength) - this.props.tipSize * 2

    // flip direction
    var oppositeZone = zone.flow == 'row' ? 'column' : 'row';

    this.tipEl.style.transform = `${tipTranslateFuncDict[zone.flow]}(${tipCrossPos}px)` +
      `${tipTranslateFuncDict[oppositeZone]}(2px)`

    /* Record fact that repaint is synced. */

    this.p1 = this.p2
  },
  measurePopoverSize() {
    this.size = {
      w: this.containerEl.offsetWidth,
      h: this.containerEl.offsetHeight
    }
  },
  measureTargetBounds() {
    let targetBounds = calcBounds(this.targetEl)
    if (!this.p1) {
      this.p2 = targetBounds
    } else if (!equalCoords(targetBounds, this.p2)) {
      this.p1 = this.p2
      this.p2 = targetBounds
    }
    return this.p1 !== this.p2
  },
  componentDidMount() {
    // debugger
    // this.targetEl = this.props.target ? findDOMNode(this.props.target) : findDOMNode(this)
    this.targetEl = this.props.target
    if (this.props.isOpen) this.enter()
  },
  componentWillReceiveProps(propsNext) {
    let willOpen = !this.props.isOpen && propsNext.isOpen
    let willClose = this.props.isOpen && !propsNext.isOpen
    this.targetEl = propsNext.target
    if (willOpen) this.open()
    if (willClose) this.close()

  },
  open() {
    if (this.state.exiting) this.animateExitStop()
    this.setState({ toggle: true, exited: false })
  },
  close() {
    /* TODO?: we currently do not setup any `entering` state flag because
    nothing would really need to depend on it. Stopping animations is currently nothing
    more than clearing some timeouts which are safe to clear even if undefined. The
    primary reason for `exiting` state is for the `layerRender` logic. */
    this.animateEnterStop()
    this.setState({ toggle: false })
  },
  componentDidUpdate(propsPrev, statePrev) {
    let didOpen = !statePrev.toggle && this.state.toggle
    let didClose = statePrev.toggle && !this.state.toggle

    if (didOpen) this.enter()
    else if (didClose) this.exit()
  },
  enter() {
    this.trackPopover()
    this.animateEnter()
  },
  exit() {
    this.animateExit()
    this.untrackPopover()
  },
  animateExitStop() {
    clearTimeout(this.exitingAnimationTimer1)
    clearTimeout(this.exitingAnimationTimer2)
    this.setState({ exiting: false })
  },
  animateExit() {
    this.setState({ exiting: true })
    this.exitingAnimationTimer2 = setTimeout(() => {
      setTimeout(() => {
        this.containerEl.style.transform = `${popoverTranslateFuncDict[this.zone.flow]}(${this.zone.order * 10}px) scale(0.97)`
        this.containerEl.style.opacity = '0'
      }, 0)
    }, 0)

    this.exitingAnimationTimer1 = setTimeout(() => {
      this.setState({ exited: true, exiting: false })
    }, this.props.enterExitTransitionDurationMs)
  },
  animateEnterStop() {
    clearTimeout(this.enteringAnimationTimer1)
    clearTimeout(this.enteringAnimationTimer2)
  },
  animateEnter() {
    /* Prepare `entering` style so that we can then animate it toward `entered`. */

    this.containerEl.style.transform = `${popoverTranslateFuncDict[this.zone.flow]}(${this.zone.order * 10}px) scale(0.97)`
    this.containerEl.style.opacity = '0'

    /* After initial layout apply transition animations. */

    this.enteringAnimationTimer1 = setTimeout(() => {
      this.tipEl.style.transition = 'transform 150ms ease-in'
      this.containerEl.style.transitionProperty = 'top, left, opacity, transform'
      this.containerEl.style.transitionDuration = '500ms'
      this.containerEl.style.transitionTimingFunction = 'cubic-bezier(0.230, 1.000, 0.320, 1.000)'
      this.enteringAnimationTimer2 = setTimeout(() => {
        this.containerEl.style.opacity = '1'
        this.containerEl.style.transform = 'translateY(0) scale(1)'
      }, 0)
    }, 0)
  },
  trackPopover() {
    let refreshIntervalMs = 200

    /* Get references to DOM elements. */

    this.containerEl = findDOMNode(this.layerReactComponent)
    this.bodyEl = this.containerEl.querySelector('.Popover-body')
    this.tipEl = this.containerEl.querySelector('.Popover-tip')

    /* Note: frame is hardcoded to window now but we think it will
    be a nice feature in the future to allow other frames to be used
    such as local elements that further constrain the popover's world. */

    this.frameEl = window

    /* Watch for boundary changes in all deps, and when one of them changes, recalculate layout.
    This layout monitoring must be bound immediately because a layout recalculation can recusively
    cause a change in boundaries. So if we did a one-time force-layout before watching boundaries
    our final position calculations could be wrong. See comments in resolver function for details
    about which parts can trigger recursive recalculation. */

    this.checkLayoutInterval = setInterval(this.checkTargetReposition, refreshIntervalMs)
    this.frameEl.addEventListener('scroll', this.onFrameScroll)
    resizeEvent.on(this.frameEl, this.onFrameBoundsChange)
    resizeEvent.on(this.containerEl, this.onPopoverSizeChange)
    console.log("target el is", this.targetEl, this.onTargetResize)
    resizeEvent.on(this.targetEl, this.onTargetResize)

    /* Track user actions on the page. Anything that occurs _outside_ the Popover boundaries
    should close the Popover.  */

    window.addEventListener('mousedown', this.checkForOuterAction)
    window.addEventListener('touchstart', this.checkForOuterAction)

    /* Kickstart layout at first boot. */

    this.measurePopoverSize()
    this.measureFrameBounds()
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  },
  checkForOuterAction() {
    let isOuterAction = (
      !this.containerEl.contains(event.target) &&
      !this.targetEl.contains(event.target)
    )
    if (isOuterAction) this.props.onOuterAction()
  },
  untrackPopover() {
    clearInterval(this.checkLayoutInterval)
    this.frameEl.removeEventListener('scroll', this.onFrameScroll)
    resizeEvent.off(this.frameEl, this.onFrameBoundsChange)
    resizeEvent.off(this.containerEl, this.onPopoverSizeChange)
    resizeEvent.off(this.targetEl, this.onTargetResize)
    window.removeEventListener('mousedown', this.checkForOuterAction)
    window.removeEventListener('touchstart', this.checkForOuterAction)
  },
  onTargetResize() {
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  },
  onPopoverSizeChange() {
    this.measurePopoverSize()
    this.resolvePopoverLayout()
  },
  onFrameScroll () {
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  },
  onFrameBoundsChange() {
    this.measureFrameBounds()
    this.resolvePopoverLayout()
  },
  measureFrameBounds() {
    this.frameBounds = calcBounds(this.frameEl)
  },
  componentWillUnmount() {
    clearInterval(this.checkLayoutInterval)
  },
  renderLayer() {
    if (this.state.exited) return null

    let { className = '', style = {} } = this.props

    let popoverProps = {
      className: `Popover ${className}`,
      style: merge({}, coreStyle, style)
    }

    let tipProps = {
      direction: faces[this.state.standing],
      size: this.props.tipSize
    }

    /* If we pass array of nodes to component children React will complain that each
    item should have a key prop. This is not a valid requirement in our case. Users
    should be able to give an array of elements applied as if they were just normal
    children of the body component. */

    let popoverBody = Array.isArray(this.props.body) ? this.props.body : [this.props.body]

    return (
      e.div(popoverProps,
        e.div({ className: 'Popover-body' }, ...popoverBody),
        createElement(PopoverTip, tipProps)
      )
    )
  },
  render() {
    return <div>{this.props.children}</div>
  }
})

let PopoverTip = React.createClass({
  name: 'tip',
  render() {
    let { direction } = this.props
    let size = this.props.size || 48
    let isPortrait = direction === 'up' || direction === 'down'
    let mainLength = size
    let crossLength = size * 2
    let points = (
      direction === 'up' ? `0,${mainLength} ${mainLength},0, ${crossLength},${mainLength}`
      : direction === 'down' ? `0,0 ${mainLength},${mainLength}, ${crossLength},0`
      : direction === 'left' ? `${mainLength},0 0,${mainLength}, ${mainLength},${crossLength}`
      : `0,0 ${mainLength},${mainLength}, 0,${crossLength}`
     )

    let triangle = e.svg({
      className: 'Popover-tip',
      width: isPortrait ? crossLength : mainLength,
      height: isPortrait ? mainLength : crossLength,
      style: { [`border${flipDirection[direction]}`]: '1px solid #fafafa' }
    },
      e.polygon({
        className: 'Popover-tipShape',
        stroke: '#ccc',
        points
      })
    )

    return (
      triangle
    )
  }
})




function ReactLayerMixin() {
  return {
    componentWillMount() {
      /* Create a DOM node for mounting the React Layer. */
      this.layerContainerNode = document.createElement('div')
    },
    componentDidMount() {
      /* Mount the mount. */
      document.body.appendChild(this.layerContainerNode)
      this._layerRender()
    },
    componentDidUpdate() {
      this._layerRender()
    },
    componentWillUnmount() {
      this._layerUnrender()
      /* Unmount the mount. */
      document.body.removeChild(this.layerContainerNode)
    },
    _layerRender() {
      let layerReactEl = this.renderLayer()
      if (!layerReactEl) {
        this.layerReactComponent = null
        render(e.noscript(), this.layerContainerNode)
      } else {
        this.layerReactComponent = render(layerReactEl, this.layerContainerNode)
      }
    },
    _layerUnrender() {
      if (this.layerWillUnmount) this.layerWillUnmount(this.layerContainerNode)
      unmountComponentAtNode(this.layerContainerNode)
    }
    // Must be implemented by consuming component:
    // renderLayer() {}
  }
}






/* Algorithm for picking the best fitting zone for popover. The current technique will
loop through all zones picking the last one that fits. If none fit the last one is selected.
TODO: In the case that none fit we should pick the least-not-fitting zone. */

function pickZone (targetBounds, popoverBounds, frameBounds) {
  let l = targetBounds, f = frameBounds, p = popoverBounds
  return [
    { standing: 'above', flow: 'column', order: -1, w: f.x2, h: l.y },
    { standing: 'right', flow: 'row', order: 1, w: (f.x2 - l.x2), h: f.y2 },
    { standing: 'below', flow: 'column', order: 1, w: f.x2, h: (f.y2 - l.y2) },
    { standing: 'left', flow: 'row', order: -1, w: l.x, h: f.y2 }
  ]
  .reduce((z1, z2) => canFit(z1, p) ? z1 : z2 )
}

/* Utilities for working with bounds. */

function canFit(b1, b2) {
  return b1.w > b2.w && b1.h > b2.h
}

function equalCoords(c1, c2) {
  for (var key in c1) if (c1[key] !== c2[key]) return false
  return true
}

function center(axis, flowDirection, bounds) {
  return bounds[axes[flowDirection][axis].start] + (bounds[axes[flowDirection][axis].size] / 2)
}



/* React 12<= / >=13 compatible findDOMNode function. */

let supportsFindDOMNode = Number(React.version.split('.')[1]) >= 13 ? true : false

function findDOMNode(component) {
  return supportsFindDOMNode ? React.findDOMNode(component) : component.getDOMNode()
}
