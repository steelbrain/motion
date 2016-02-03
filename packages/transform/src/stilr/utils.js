export function sortObject(obj) {
  return Object.keys( obj )
    .sort()
    .reduce( (acc, key) => {
      const val = obj[key];
      if ( val || val === 0 ) acc[key] = val;
      return acc;
    }, {});
}

export function createHash(str) {
  let i = str.length;
  if (i === 0) return 0;

  let hash = 5381;
  while (i)
    hash = (hash * 33) ^ str.charCodeAt(--i);

  return hash >>> 0;
}

export function stringifyObject(obj) {
  const keys = Object.keys(obj);
  let str = '';

  for (let i = 0, len = keys.length; i < len; i++) {
    str += keys[i] + obj[keys[i]];
  }

  return str;
}

const SYMBOL_SET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export function extendedToString(num, base) {
  let conversion = '';

  if (base > SYMBOL_SET.length || base <= 1 || !Number.isInteger(base))
    throw new Error(`${base} should be an integer between 1 and ${SYMBOL_SET.length}`);

  while (num >= 1) {
    conversion = SYMBOL_SET[(num - (base * Math.floor(num / base)))] + conversion;
    num = Math.floor(num / base);
  }

  return (base < 11) ? parseInt(conversion) : conversion;
}

export function createClassName(options, tag, obj) {
  if (options && options.selector) {
    return options.selector(tag)
  }

  const hash = extendedToString( createHash( stringifyObject(obj) ), 62);
  return hash
    ? '_' + hash
    : undefined;
}

export function isEmpty(obj) {
  return !Object.keys(obj).length;
}

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

export function isPseudo({ style, rule }) {
  return (rule.charAt(0) === ':' || pseudos[rule]) && typeof style === 'object';
}

export function isMediaQuery({ style, rule }) {
  return rule.charAt(0) === '@' && typeof style === 'object';
}

function handle(options, tag, type, acc, { style, rule }, pseudos = []) {
  const hash = createClassName( options, tag, sortObject( style ));
  const rules = pseudos.length
    ? [[].concat(rule, style, pseudos)]
    : rule;

  acc[type] = acc[type].concat(rules);
  acc.style[rule] = hash;
  return acc;
}


export function seperateStyles (options, tag, styles) {
  return Object.keys(styles).reduce( (acc, rule) => {
    const content = {
      style: styles[rule] === '' ? 'auto' : styles[rule],
      rule
    };

    if ( isPseudo( content ) ) {
      if (pseudos[rule]) content.rule = pseudos[rule] // translate to :active
      return handle(options, tag, 'pseudos', acc, content );
    }

    if ( isMediaQuery( content ) ) {
      const { style, pseudos } = seperateStyles( options, tag, content.style );
      return handle(options, tag, 'mediaQueries', acc, { rule, style }, pseudos );
    }

    acc.style[rule] = content.style;
    return acc;
  }, {
    style: {},
    pseudos: [],
    mediaQueries: []
  });
}
