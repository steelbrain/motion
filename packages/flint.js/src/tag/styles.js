import reportError from '../lib/reportError'
import niceStyles from 'flint-nice-styles'

const isLowerCase = s => s.toLowerCase() == s

const mergeStyles = (obj, ...styles)  => {
  return styles.reduce((acc, style) => {
    if (Array.isArray(style))
      style.map(s => acc = mergeStyles(acc, s))
    else if (typeof style === 'object' && style !== null) {
      if (!acc) acc = {}
      Object.assign(acc, style)
    }

    return acc
  }, obj)
}

const prefix = '$'

// <name-tag />
export default function elementStyles(key, index, repeatItem, view, name, tag, props) {
  if (typeof name !== 'string') return

  let styles
  let parentStyles, parentStylesStatic, parentStylesStaticView

  // attach view styles from $ to element matching view name lowercase
  const Flint = view.Flint
  const isRootName = view.name && view.name.toLowerCase() == name
  const hasOneRender = view.renders.length <= 1
  const isWrapper = props && props.isWrapper
  const deservesRootStyles = (isRootName && hasOneRender || isWrapper)

  function addClassName(name) {
    props.className = props.className ? `${props.className} ${name}` : name
  }

  if (deservesRootStyles) {
    if (view.props.__flint) {
      parentStyles = view.props.__flint.parentStyles
      parentStylesStatic = Flint.styleObjects[view.props.__flint.parentName]
      parentStylesStaticView = parentStylesStatic && parentStylesStatic[`$${view.name}`]
    }

    // TODO: shouldnt be in styles
    if (view.props.className) {
      addClassName(view.props.className)
    }
  }

  if (view.styles || parentStylesStatic || parentStylesStaticView) {
    // if <foobar> is root, then apply both the base ($) and ($foobar)
    const diffName = name !== tag
    const hasTag = typeof tag == 'string'
    const tagStyle = hasTag && view.styles[tag] && view.styles[tag](repeatItem, index)

    const classes = Flint.styleClasses[view.name]
    const viewStyle = view.styles[prefix] && view.styles[prefix](index)
    const nameStyle = diffName && view.styles[name] && view.styles[name](repeatItem, index)

    // merge styles

    let result = mergeStyles({},
      // tag style
      tagStyle,
      // name dynamic styles
      nameStyle,
      // base style
      deservesRootStyles && viewStyle,
      // passed down styles
      parentStyles && parentStyles[`${prefix}${view.name}`],
    )

    // for use in className loop
    const viewStaticStyles = Flint.styleObjects[view.name]

    // add class styles
    if (props.className) {
      props.className.split(' ').forEach(className => {
        if (!isLowerCase(className[0])) return

        if (view.styles[className]) {
          result = mergeStyles(result, view.styles[className](index))
        }

        // ensure static class styles overwrite dynamic tag/name styles
        if (viewStaticStyles) {
          const staticClassStyles = viewStaticStyles[`${prefix}${className}`]
          if (staticClassStyles) {
            Object.keys(staticClassStyles).forEach(key => {
              // check if already in styles, and rewrite to class style
              if (typeof result[key] != 'undefined') {
                result[key] = staticClassStyles[key]
              }
            })
          }
        }
      })
    }

    // parent class styles
    if (deservesRootStyles && view.props.className) {
      view.props.className.split(' ').forEach(className => {
        if (!isLowerCase(className[0])) return
        const key = `${prefix}${className}`
        result = mergeStyles(result, parentStyles[key], parentStylesStatic[key])
      })
    }

    // merge styles [] into {}
    if (Array.isArray(result))
      result = mergeStyles(...result)

    // add view external props.style
    if (deservesRootStyles && view.props.style)
      result = mergeStyles(result, view.props.style)

    // add style="" prop styles
    if (props.style)
      result = mergeStyles(result, props.style)

    // put styles back into props.style
    if (result)
      styles = result
  }

  // HELPERS
  niceStyles(styles)

  // overwrite any parent styles onto root
  if (parentStylesStaticView) {
    let pssv = niceStyles.object(parentStylesStaticView)

    Object.keys(pssv).forEach(key => {
      styles[key] = pssv[key]
    })
  }

  // set body bg to Main view bg
  if (
    view.name == 'Main' &&
    name == 'view.Main' &&
    typeof document != 'undefined'
  ) {
    const body = document.body
    const bg = props.style && (props.style.background || props.style.backgroundColor)

    if (!bg)
      body.style.background = ''

    if (bg && body) {
      body.style.background = bg
    }
  }

  return styles
}
