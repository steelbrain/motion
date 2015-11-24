import reportError from '../lib/reportError'
import objectToColor from '../lib/objectToColor'

const upper = s => s.toUpperCase()
const capital = s => upper(s.substr(0, 1)) + s.slice(1)
const isLowerCase = s => s.toLowerCase() == s

const pseudos = {
  active: ':active',
  hover: ':hover',
  focus: ':focus',
  link: ':link',
  visited: ':visited',
  checked: ':checked',
  disabled: ':disabled',
  empty: ':empty',
  invalid: ':invalid',
}

const transformKeysMap = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ'
}

const isNumerical = (obj, key) =>
  ['x','y','z'].indexOf(key) == 0 && typeof obj[key] == 'number'

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

const arrayToString = val =>
  val.map(style =>
    typeof style == 'number' ? `${style}px` : style
  ).join(' ')

// <name-tag />
export default function elementStyles(key, view, name, tag, props) {
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

  if (view.styles) {
    const index = props.repeat ? key[1] : void 0

    // if <foobar> is root, then apply both the base ($) and ($foobar)
    const diffName = name !== tag
    const hasTag = typeof tag == 'string'
    const tagStyle = hasTag && view.styles[tag] && view.styles[tag](index)

    const classes = Flint.styleClasses[view.name]
    const viewStyle = view.styles[prefix] && view.styles[prefix](index)
    const nameStyle = diffName && view.styles[name] && view.styles[name](index)

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
              // console.log(key, staticClassStyles[key])
              // check if already in styles, and rewrite to class style
              if (typeof result[key] != 'undefined') {
                result[key] = staticClassStyles[key]
              }
            })
          }
        }
      })
    }

    // TODO: this shouldnt work with hot reloads anymore because we wont call re-render
    // parent $Child classes apply to Child wrapper
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
  if (styles) {
    // position
    if (styles.position && Array.isArray(styles.position)) {
      styles.top = styles.position[0]
      styles.right = styles.position[1]
      styles.bottom = styles.position[2]
      styles.left = styles.position[3]
      styles.position = 'absolute'
    }

    // background rgba
    if (styles.background && typeof styles.background == 'object')
      styles.background = objectToColor(styles.background)

    // color rgba
    if (styles.color && typeof styles.color == 'object')
      styles.color = objectToColor(styles.color)

    // final styles
    Object.keys(styles).forEach(key => {
      // when live coding we type "rc" then "rc()"
      // but "rc" is a function and it breaks, so clear it
      if (typeof styles[key] == 'function') {
        styles[key] = null
        console.warn(`Passed a function to a style property in view ${view.name} tag ${tag}`)
      }

      // convert pseudos 'active' => ':active'
      if (pseudos[key] && typeof styles[key] == 'object') {
        styles[pseudos[key]] = styles[key]
      }

      // array to string transforms
        // @media queries
      if (key[0] == '@')
        Object.keys(styles[key]).forEach(subKey => {
          if (Array.isArray(styles[key][subKey]))
            styles[key][subKey] = arrayToString(styles[key][subKey])
        })
        // regular
      else if (Array.isArray(styles[key]))
        styles[key] = arrayToString(styles[key])
    })

    // { transform: { x: 10, y: 10, z: 10 } }
    if (typeof styles.transform === 'object') {
      styles.transform = Object.keys(styles.transform).map(key =>
        `${transformKeysMap[key] || key}(${styles.transform[key]}${isNumerical(styles.transform, key) ? 'px' : ''})`
      ).join(' ')
    }
  }

  // overwrite any parent styles onto root
  if (parentStylesStaticView) {
    Object.keys(parentStylesStaticView).forEach(key => {
      styles[key] = parentStylesStaticView[key]
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
