import objectToColor from './objectToColor'

const isNumerical = (obj, key) =>
  ['x','y','z'].indexOf(key) >= 0 && typeof obj[key] == 'number'

const pseudoAbbrs = {
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

const pseudos = {
  ':active': true,
  ':hover': true,
  ':focus': true,
  ':link': true,
  ':visited': true,
  ':checked': true,
  ':disabled': true,
  ':empty': true,
  ':invalid': true
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

function transformColor(styles, attr) {
  return typeof styles[attr] == 'object'
    ? objectToColor(styles[attr])
    : styles[attr]
}

function transformKey(styles, key) {
  // convert pseudoAbbrs 'active' => ':active'
  if (pseudoAbbrs[key] && typeof styles[key] == 'object') {
    styles[pseudoAbbrs[key]] = styles[key]
    // normalize to :active
    key = pseudoAbbrs[key]
  }

  // when live coding we type "rc" then "rc()", but "rc" is a function and it breaks, so clear it
  if (typeof styles[key] == 'function') {
    styles[key] = null
    throw new Error(`Passed a function to a style property ${key}`)
  }

  // recurse into psuedos
  if (pseudos[key]) {
    styleValuesToString(styles[key])
  }

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
    return styles.transform

  return Object.keys(styles.transform).map(key =>
    `${transformKeysMap[key] || key}(${styles.transform[key]}${isNumerical(styles.transform, key) ? 'px' : ''})`
  ).join(' ')
}

// mutative :(
export default function styleValuesToString(styles) {
  if (!styles) return styles

  if (styles.background)
    styles.background = transformColor(styles, 'background')

  if (styles.backgroundColor)
    styles.backgroundColor = transformColor(styles, 'backgroundColor')

  if (styles.color)
    styles.color = transformColor(styles, 'color')

  if (styles.borderColor)
    styles.borderColor = transformColor(styles, 'borderColor')

  if (styles.transform)
    styles.transform = transformTransform(styles)

  // final styles
  Object.keys(styles).forEach(key => transformKey(styles, key))
}

styleValuesToString.object = (styles) => {
  styleValuesToString(styles)
  return styles
}
