import objectToColor from './objectToColor'

const isNumerical = (obj, key) =>
  ['x','y','z'].indexOf(key) == 0 && typeof obj[key] == 'number'

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

const arrayToString = val =>
  val.map(style =>
    typeof style == 'number' ? `${style}px` : style
  ).join(' ')

// mutative :/

export default function styleValuesToString(styles) {
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
}