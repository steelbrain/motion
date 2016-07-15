## motion-nice-styles

Turns objects into nice CSS styles. Has a few helpers:

- Arrays to strings:
  `border: [1, 'solid', '#eee']`
- Transform objects:
  `transform: { x: 0, y: 10 }`
- Easy pseudos:
  `hover: { background: 'red' }`
- Color objects:
  `background: [0, 255, 0]`
- Converts css-able functions/objects:
  `background: chroma('#fff') // will call .css() automatically`
- Recurses into media queries
  `'@media screen': { ... }`
