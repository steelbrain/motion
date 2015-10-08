let cachedStyles = {};

const upper = s => s.toUpperCase()
const capital = s => upper(s.substr(0, 1)) + s.slice(1)

const transformKeysMap = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ'
}

const mergeStyles = (obj, ...styles)  => {
  let result = obj || {};

  return styles.reduce((acc, style) => {
    if (Array.isArray(style))
      style.map(s => mergeStyles(acc, s))
    else if (typeof style === 'object')
      Object.assign(acc, style);

    return acc;
  }, result);
}

const prefix = '$'

export default function elementStyles(key, view, name, tag, props) {
  if (typeof name !== 'string') {
    return
  }

  // if its the root element (name === view or Wrapper)
  const isViewBaseElement = name.indexOf('Flint.') == 0 || view.name.toLowerCase() == name

  if (view.styles) {
    const viewStyles = view.styles;
    // allows for $ to access everything

    /*
      if <foobar> is root, then apply both the base($) and ($foobar)
    */

    const viewStyle = viewStyles[prefix]
    const nameStyle = viewStyles[prefix + name]
    const tagStyle = viewStyles[prefix + tag]

    const index = props.repeat ? key()[0] : void 0;
    const uniqueTagId = view.entityId + name + tag;

    let tagStyles;
    let ran = false;

    // TODO: only try catch in dev mode
    try {
      tagStyles = Object.assign(
        // tag style
        tagStyle ? tagStyle(index) : {},
        // base style
        isViewBaseElement && viewStyle && viewStyle(index),
        // name styles
        nameStyle && name !== tag && nameStyle(index)
      );

      // add class styles
      if (props.className) {
        props.className.split(' ').forEach(className => {
          const classSelector = `${prefix}_class_${className}`;
          const tagWithClassSelector = prefix + name + classSelector;

          if (viewStyles[tagWithClassSelector])
            tagStyles = mergeStyles(null, tagStyles, viewStyles[tagWithClassSelector](index))

          if (viewStyles[classSelector]) {
            tagStyles = mergeStyles(null, tagStyles, viewStyles[classSelector](index))
          }
        });
      }

      ran = true;
    }
    catch (e) {
      console.error(
        'error running style for', name, e.message,
        'using last good style', cachedStyles[uniqueTagId]
      );

      props.style = cachedStyles[uniqueTagId];
    }

    if (ran) {
      // merge styles [] into {}
      if (Array.isArray(tagStyles))
        tagStyles = mergeStyles(null, ...tagStyles);

      // add style="" prop styles
      if (props.style)
        tagStyles = mergeStyles(null, tagStyles, props.style);

      // put styles back into props.style
      if (tagStyles)
        props.style = tagStyles;

      // apply view styles if this is wrapper
      if (viewStyles.view && name.indexOf('Flint.') == 0)
        Object.assign(props.style, viewStyles.view);

      // cache styles
      cachedStyles[uniqueTagId] = tagStyles;
    }
  }

  // HELPERS
  if (props.style) {
    const ps = props.style;

    // position
    if (Array.isArray(ps.position)) {
      ps.top = ps.position[0];
      ps.right = ps.position[1];
      ps.bottom = ps.position[2];
      ps.left = ps.position[3];
      ps.position = 'absolute'
    }

    // array to string
    Object.keys(ps).forEach(key => {
      if (Array.isArray(ps[key])) {
        ps[key] = ps[key].map(style =>
          typeof style == 'number' ? `${style}px` : style
        ).join(' ')
      }
    })

    // { transform: { x: 10, y: 10, z: 10 } }
    if (typeof ps.transform === 'object') {
      ps.transform = Object.keys(ps.transform).map(key =>
        `${transformKeysMap[key] || key}(${ps.transform[key]})`
      ).join(' ');
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

  // add view external (prop) styles
  if (isViewBaseElement && view.props.style && name !== 'Flint.Wrapper') {
    props.style = Object.assign(props.style || {}, view.props.style)
  }

  // set body bg to Main view bg
  if (
    view.name == 'Main' &&
    name == 'Flint.MainWrapper' &&
    props.style &&
    typeof document != 'undefined'
  ) {
    const bg = props.style.background || props.style.backgroundColor;
    const body = document.body;

    // if body already has bg, ignore
    if (bg && body && !body.style.background && !body.style.backgroundColor) {
      body.style.background = bg;
    }
  }
}
