import reportError from '../lib/reportError'

const upper = s => s.toUpperCase()
const capital = s => upper(s.substr(0, 1)) + s.slice(1)

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
  if (typeof name !== 'string')
    return

  // attach view styles from $ to element matching view name lowercase
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
    const tagStyle = hasTag && view.styles[tag]

    const viewStyle = view.styles[prefix] && view.styles[prefix](index)
    const nameStyle = view.styles[name]

    if (view.Flint.styleClasses[view.name]) {
      console.log(view.Flint.styleClasses)
      const classes = view.Flint.styleClasses[view.name]
      const tagClass = classes[`${prefix}${tag}`]
      const nameClass = nameClass != tagClass && classes[`${prefix}${name}`]
      console.log(tag, name, tagClass, nameClass, classes)

      if (deservesRootStyles && classes[prefix]) addClassName(classes[prefix])
      if (tagClass) addClassName(tagClass)
      if (nameClass) addClassName(nameClass)
    }

    // add tag and name styles
    let result = mergeStyles(null,
      // tag style
      tagStyle ? tagStyle(index) : null,
      // base style
      deservesRootStyles && viewStyle,
      // name dynamic styles
      nameStyle && diffName && nameStyle(index)
    )

    // add class styles
    if (props.className) {
      props.className.split(' ').forEach(className => {
        if (view.styles[className] || view.styles._static[className])
          result = mergeStyles(result, view.styles[className] && view.styles[className](index), view.styles._static[className])
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
      props.style = result
  }

  // HELPERS
  if (props.style) {
    const ps = props.style

    // zIndex add position:relative
    if (typeof ps.zIndex != 'undefined' && typeof ps.position == 'undefined')
      ps.position = 'relative'

    // position
    if (ps.position && Array.isArray(ps.position)) {
      ps.top = ps.position[0]
      ps.right = ps.position[1]
      ps.bottom = ps.position[2]
      ps.left = ps.position[3]
      ps.position = 'absolute'
    }

    // background { r, g, b, a }
    if (ps.background && typeof ps.background == 'object') {
      const bg = ps.background

      if (Array.isArray(bg)) {
        if (bg.length == 4)
          ps.background = `rgba(${bg[0]}, ${bg[1]}, ${bg[2]}, ${bg[3]})`
        else
          ps.background = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`
      }
      else {
        if (bg.a)
          ps.background = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`
        else
          ps.background = `rgb(${bg.r}, ${bg.g}, ${bg.b})`
      }
    }

    // final maps
    Object.keys(ps).forEach(key => {
      // array to string transforms
        // @media queries
      if (key[0] == '@')
        Object.keys(ps[key]).forEach(subKey => {
          if (Array.isArray(ps[key][subKey]))
            ps[key][subKey] = arrayToString(ps[key][subKey])
        })
        // regular
      else if (Array.isArray(ps[key]))
        ps[key] = arrayToString(ps[key])
    })

    // { transform: { x: 10, y: 10, z: 10 } }
    if (typeof ps.transform === 'object') {
      ps.transform = Object.keys(ps.transform).map(key =>
        `${transformKeysMap[key] || key}(${ps.transform[key]}${isNumerical(ps.transform, key) ? 'px' : ''})`
      ).join(' ')
    }
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
}
