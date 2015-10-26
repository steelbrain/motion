import reportError from '../lib/reportError'

const upper = s => s.toUpperCase()
const capital = s => upper(s.substr(0, 1)) + s.slice(1)

const transformKeysMap = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ'
}

const mergeStyles = (obj, ...styles)  => {
  return styles.reduce((acc, style) => {
    if (Array.isArray(style))
      style.map(s => acc = mergeStyles(acc, s))
    else if (typeof style === 'object') {
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

export default function elementStyles(key, view, name, tag, props) {
  // <name-tag>hello</name-tag>
  // console.log('name', name, 'tag', tag)

  if (typeof name !== 'string')
    return

  // if its the root element (name === view or Wrapper)
  const isRoot = (
    name.indexOf('Flint.') == 0 ||
    view.name && view.name.toLowerCase() == name
  )

  if (view.styles) {
    const index = props.repeat ? key[1] : void 0

    // if <foobar> is root, then apply both the base ($) and ($foobar)
    const diffName = name !== tag
    const hasTag = typeof tag == 'string'
    const tagStyle = hasTag && view.styles[prefix + tag]

    const viewStyle = view.styles[prefix] && view.styles[prefix](index)
    const viewStyleStatic = view.styles._static[prefix]
    const nameStyle = view.styles[prefix + name]

    let nameStyleStatic
    const tagStyleStatic = view.styles._static[prefix + tag]

    if (diffName)
      nameStyleStatic = view.styles._static[prefix + name]

    let result
    let ran = false

    result = mergeStyles(null,
      // if set using one big object,
      viewStyle && viewStyle[tag],
      viewStyle && viewStyle[name],
      viewStyleStatic && viewStyleStatic[tag],
      viewStyleStatic && viewStyleStatic[name],

      // tag style
      tagStyle ? tagStyle(index) : null,
      // base style
      isRoot && viewStyle,
      isRoot && viewStyleStatic,
      // name dynamic styles
      nameStyle && diffName && nameStyle(index),
      // tag static
      tagStyleStatic,
      // name static
      nameStyleStatic,
    )

    // add class styles
    if (props.className) {
      props.className.split(' ').forEach(className => {
        const classSelector = `_class_${className}`
        const justClass = prefix + classSelector
        const nameAndClass = prefix + name + classSelector

        // $.class = {}
        if (view.styles[justClass] || view.styles._static[justClass])
          result = mergeStyles(result, view.styles[justClass] && view.styles[justClass](index), view.styles._static[justClass])

        // $name.class = {}
        if (view.styles[nameAndClass] || view.styles._static[nameAndClass])
          result = mergeStyles(result, view.styles[nameAndClass] && view.styles[nameAndClass](index), view.styles._static[nameAndClass])
      })
    }

    ran = true

    if (ran) {
      // merge styles [] into {}
      if (Array.isArray(result))
        result = mergeStyles(...result)

      // add style="" prop styles
      if (props.style)
        result = mergeStyles(result, props.style)

      // apply view internal $ styles
      if (name.indexOf('Flint.') == 0) {
        result = mergeStyles(result, )
      }

      // add view external props.style
      if (isRoot && view.props.style)
        result = mergeStyles(result, view.props.style)

      // put styles back into props.style
      if (result)
        props.style = result
    }
  }

  // HELPERS
  if (props.style) {
    const ps = props.style

    // position
    if (ps.position && Array.isArray(ps.position)) {
      ps.top = ps.position[0]
      ps.right = ps.position[1]
      ps.bottom = ps.position[2]
      ps.left = ps.position[3]
      ps.position = 'absolute'
    }

    // array to string
    Object.keys(ps).forEach(key => {
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
        `${transformKeysMap[key] || key}(${ps.transform[key]})`
      ).join(' ')
    }

    // background { r, g, b, a }
    if (ps.background && typeof ps.background == 'object') {
      const bg = ps.background

      if (bg.a)
        ps.background = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`
      else
        ps.background = `rgb(${bg.r}, ${bg.g}, ${bg.b})`
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
