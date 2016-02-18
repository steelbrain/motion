'use babel'

export default [
  {
    name: 'color',
    description: 'Sets the text color',
    auto: '#333333',
    strength: 100
  },
  {
    name: 'margin',
    description: 'Spacing around an element',
    auto: 10,
    strength: 100
  },
  {
    name: 'maxHeight',
    description: 'Maximum height of element',
    auto: 100,
    strength: 100
  },
  {
    name: 'maxWidth',
    description: 'Maximum width of element',
    auto: 100,
    strength: 100
  },
  {
    name: 'minHeight',
    description: 'Minimum height of element',
    auto: 100,
    strength: 100
  },
  {
    name: 'minWidth',
    description: 'Minimum width of element',
    auto: 100,
    strength: 100
  },
  {
    name: 'flexDirection',
    description: 'Row or Column, sets direction element flows in',
    options: ['row', 'col'],
    auto: 'row',
    strength: 80
  },
  {
    name: 'transition',
    description: 'Transition values for element',
    auto: 'all ease-in 300ms',
    strength: 100
  },
  {
    name: 'height',
    description: 'Height of the element',
    options: [100, '100%'],
    auto: 100,
    strength: 80
  },
  {
    name: 'width',
    description: 'Width of the element',
    options: [100, '100%'],
    auto: 100,
    strength: 80
  },
  {
    name: 'border',
    description: 'Border of the element',
    auto: '1px solid #333',
    strength: 100
  },
  {
    name: 'borderRadius',
    description: 'Border radius of the element',
    auto: 10,
    strength: 100
  },
  {
    name: 'background',
    description: 'Background of the element',
    auto: '#eee',
    strength: 100
  },
  {
    name: 'backgroundColor',
    description: 'Background color of the element',
    auto: '#fff',
    strength: 80
  },
  {
    name: 'textAlign',
    description: 'Alignment of the element',
    options: ['left', 'center', 'right'],
    auto: 'center',
    strength: 80
  },
  {
    name: 'float',
    description: 'Adds a float to an item',
    auto: 'left',
    options: ['left', 'right', 'none'],
    strength: 100
  },
  {
    name: 'font',
    description: 'Sets font of text',
    auto: '14px/1.4rem Helvetica, Arial, sans-serif',
    strength: 100
  },
  {
    name: 'fontFamily',
    description: 'Sets font family of text',
    auto: 'Helvetica, Arial, sans-serif',
    strength: 80
  },
  {
    name: 'fontWeight',
    description: 'Sets weight of text',
    auto: 400,
    strength: 80
  },
  {
    name: 'fontSize',
    description: 'Sets size of text',
    auto: 16,
    strength: 100
  },
  {
    name: 'position',
    description: 'Positioning strategy',
    options: ['relative', 'fixed', 'absolute'],
    auto: 'absolute',
    strength: 100
  },
  {
    name: 'top',
    description: 'Positioning from top',
    auto: 0,
    strength: 100
  },
  {
    name: 'left',
    description: 'Positioning from left',
    auto: 0,
    strength: 100
  },
  {
    name: 'bottom',
    description: 'Positioning from bottom',
    auto: 0,
    strength: 100
  },
  {
    name: 'right',
    description: 'Positioning from right',
    auto: 0,
    strength: 100
  },
  {
    name: 'padding',
    description: 'Spacing inside an element',
    auto: 10,
    strength: 100
  },
  {
    name: 'whiteSpace',
    description: 'How to treat white space of text',
    options: ['wrap', 'nowrap', 'break-word'],
    auto: 'nowrap',
    strength: 100
  },
  {
    name: 'zIndex',
    description: 'Layer index in document',
    auto: 1,
    strength: 100
  },
]
