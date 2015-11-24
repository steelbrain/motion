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


// transformers

function transformBackground(styles) {
  return typeof styles.background == 'object'
    ? objectToColor(styles.background)
    : styles.background
}

function transformColor(styles) {
  return typeof styles.color == 'object'
    ? objectToColor(styles.color)
    : styles.color
}

function transformKey(styles, key) {
  // when live coding we type "rc" then "rc()", but "rc" is a function and it breaks, so clear it
  if (typeof styles[key] == 'function') {
    styles[key] = null
    console.warn(`Passed a function to a style property in view ${view.name} tag ${tag}`)
  }

  // convert pseudos 'active' => ':active'
  if (pseudos[key] && typeof styles[key] == 'object')
    styles[pseudos[key]] = styles[key]

  // array to string transforms
  // @media queries
  if (key[0] == '@')
    Object.keys(styles[key]).forEach(subKey => { // TODO: make this recursive and use transformKey itself
      if (Array.isArray(styles[key][subKey]))
        styles[key][subKey] = arrayToString(styles[key][subKey])
    })
  // regular
  else if (Array.isArray(styles[key]))
    styles[key] = arrayToString(styles[key])
}

// { transform: { x: 10, y: 10, z: 10 } }
function transformTransform(styles) {
  if (typeof styles.transform !== 'object')
    return val

  return Object.keys(styles.transform).map(key =>
    `${transformKeysMap[key] || key}(${styles.transform[key]}${isNumerical(styles.transform, key) ? 'px' : ''})`
  ).join(' ')
}

// mutative :(
export default function styleValuesToString(styles) {
  if (!styles) return styles

  if (styles.background)
    styles.background = transformBackground(styles)

  if (styles.color)
    styles.color = transformColor(styles)

  if (styles.transform)
    styles.transform = transformTransform(styles)

  // final styles
  Object.keys(styles).forEach(key => transformKey(styles, key))
}

styleValuesToString.object = (styles) => {
  styleValuesToString(styles)
  return styles
}