import reportError from '../lib/reportError'
import niceStyles from 'flint-nice-styles'

const isLowerCase = s => s.toLowerCase() == s

const mergeStyles = (obj, ...styles)  => {
  return styles.reduce((acc, style) => {
    if (style && style.constructor === Array)
     for (var i = 0; i < style.length; i++)
       acc = mergeStyles(acc, style[i])
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
  let parentStyles, parentStylesStatic, parentStylesStaticView, parentStylesRoot

  // attach view styles from $ to element matching view name lowercase
  const Flint = view.Flint
  const isRootName = view.name && view.name.toLowerCase() == name
  const hasOneRender = view.renders.length <= 1
  const isWrapperOrRoot = props && (props.__flintIsWrapper || props.root)
  const deservesRootStyles = !!(isRootName && hasOneRender || isWrapperOrRoot)

  function addClassName(name) {
    props.className = props.className ? `${props.className} ${name}` : name
  }

  if (deservesRootStyles) {
    if (view.props.__flint) {
      const parentName = view.props.__flint.parentName
      parentStyles = view.props.__flint.parentStyles
      parentStylesStatic = Flint.styleObjects[parentName]
      parentStylesStaticView = parentStylesStatic && parentStylesStatic[`$${view.name}`]

      const parentRoot = Flint.viewRoots[parentName]

      // parent $={} styles pass to child
      //    view Main { <Child root />  $ = { background: 'red' }  }   <-- makes these styles work!
      //    view Child { <child /> $ = { background: 'yellow' } }
      if (parentRoot === view.name) {
        parentStylesRoot = parentStylesStatic && parentStylesStatic.$
      }
    }

    // TODO: shouldnt be in styles
    let viewClassName = view.props.className || view.props.class

    if (viewClassName) {
      addClassName(viewClassName)
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
      // passed down styles using $
      parentStylesRoot
    )

    // for use in className loop
    const viewStaticStyles = Flint.styleObjects[view.name]

    if (view.doRenderToRoot || view.doRenderInlineStyles) {
      result = mergeStyles(result,
        diffName && viewStaticStyles && viewStaticStyles[`${prefix}${name}`],
        hasTag && viewStaticStyles && viewStaticStyles[`${prefix}${tag}`],
        deservesRootStyles && viewStaticStyles && viewStaticStyles[prefix]
      )
    }

    // add class styles
    if (props.className) {
      let classes = props.className.split(' ')

      for (let i = 0; i < classes.length; i++) {
        let className = classes[i]

        if (isLowerCase(className[0])) {
          if (view.styles[className]) {
            result = mergeStyles(result, view.styles[className](index))
          }

          // ensure static class styles overwrite dynamic tag/name styles
          if (viewStaticStyles) {
            const staticClassStyles = viewStaticStyles[`${prefix}${className}`]
            if (staticClassStyles) {
              let styles = Object.keys(staticClassStyles)

              for (let j = 0; j < styles.length; j++) {
                let key = styles[j]
                // check if already in styles, and rewrite to class style
                if (typeof result[key] != 'undefined') {
                  result[key] = staticClassStyles[key]
                }
              }
            }
          }
        }
      }
    }

    // parent class styles
    if (deservesRootStyles) {
      let viewClassName = view.props.className || view.props.class

      if (viewClassName) {
        let classes = viewClassName.split(' ')

        for (let i = 0; i < classes.length; i++) {
          let className = classes[i]
          if (!isLowerCase(className[0])) continue
          const key = `${prefix}${className}`

          // merge in styles
          result = mergeStyles(
            result,
            parentStyles && (
              parentStyles[className] && parentStyles[className](repeatItem, index)
            ),
            parentStylesStatic && parentStylesStatic[key]
          )
        }
      }
    }

    // merge styles [] into {}
    if (Array.isArray(result))
      result = mergeStyles({}, result)

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

    Object.keys(pssv).forEach(key => { // TODO! Get rid of forEach
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
      body.style.background = null

    if (bg && body) {
      body.style.background = bg
    }
  }

  if (Object.keys(styles).length)
    return styles
  else
    return null
}
