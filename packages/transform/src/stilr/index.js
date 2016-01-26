import {
  sortObject,
  createClassName,
  createMarkup,
  seperateStyles,
  isEmpty,
} from './utils';

let globalStylesheet = new Map();

export default {
  create( styles, stylesheet = globalStylesheet ) {
    let options

    if ( !(stylesheet instanceof Map) ) {
      // options passed instead
      options = stylesheet
      stylesheet = globalStylesheet

      if (options.selector)
        stylesheet.customTags = true
    }

    if ( !(stylesheet instanceof Map) ) throw new Error(`${ stylesheet } should be a Map`);

    return Object.keys( styles ).reduce( ( acc, key ) => {

      let { style, pseudos, mediaQueries } = seperateStyles( options, key, styles[key] );
      const className = createClassName(options, key, sortObject(style));

      if (className === undefined) {
        acc[ key ] = '';
        return acc;
      }

      if ( !stylesheet.has( className ) )
        stylesheet.set( className, style );

      if ( pseudos.length ) {
        pseudos.map( selector => {
          delete style[selector];
          const pseudoClassName = `.${className}${selector}`;

          if ( stylesheet.has( pseudoClassName ) ) return false;

          stylesheet.set( pseudoClassName, styles[key][selector] );
        });
      }

      if ( mediaQueries.length ) {
        mediaQueries.map( selector => {
          let mqSelector = selector;
          let mqStyles = styles[key][selector];
          let mqPseudos = [];
          let mqStylesheet;

          if ( Array.isArray(selector) ) {
            let [ main, styles, ...rest ] = selector;
            mqSelector = main;
            mqPseudos = rest;
            mqStyles = styles;
          }

          delete style[mqSelector];


          if ( stylesheet.has( mqSelector ) ) {
            mqStylesheet = stylesheet.get( mqSelector );

            if ( mqStylesheet.has( className )) return false;
          }

          mqStylesheet = mqStylesheet
            || stylesheet.set( mqSelector, new Map() ).get( mqSelector );

          mqStylesheet.set( className, mqStyles );

          if ( mqPseudos.length ) {
            mqPseudos.map( pseudo => {
              delete mqStyles[pseudo];
              const pseudoClassName = `${className}${pseudo}`;

              if ( mqStylesheet.has( pseudoClassName ) ) return false;
              mqStylesheet.set( pseudoClassName, styles[key][mqSelector][pseudo] );
            });
          }
        });
      }

      acc[ key ] = className;

      return acc;
    }, {});
  },

  render(options = { pretty: false }, stylesheet = globalStylesheet ) {
    const stylesheetEntries = stylesheet.entries();
    let css = '';
    let mediaQueries = '';

    for ( let entry of stylesheetEntries ) {
      const [ className, styles ] = entry;
      const isMap = styles instanceof Map;

      if (!isMap && isEmpty(styles)) continue;

      if (isMap) {
        const mediaQueryCSS = this.render(options, stylesheet.get( className ) );
        mediaQueries += options.pretty
          ? `${ className } {\n${ mediaQueryCSS }}\n`
          : `${ className }{${ mediaQueryCSS }}`;
        continue;
      }

      const markup = createMarkup( styles );
      const prefix = stylesheet.customTags ? '' : '.'

      css += options.pretty
        ? `${prefix}${ className } {\n${ markup.split(';').join(';\n')}}\n`
        : `${prefix}${ className }{${ markup }}`;
    }

    return css + mediaQueries;
  },

  clear( stylesheet = globalStylesheet ) {
    stylesheet.clear();
    return !stylesheet.size;
  },

  Map,

  __stylesheet: globalStylesheet
};
