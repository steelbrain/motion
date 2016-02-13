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
    name: 'flexDirection',
    description: 'Row or Column, sets direction element flows in',
    options: ['row', 'col'],
    auto: 'row',
    strength: 80
  },
  {
    name: 'height',
    description: 'Height of the element',
    options: [300, '100%'],
    auto: 300,
    strength: 80
  },
  {
    name: 'width',
    description: 'Width of the element',
    options: [300, '100%'],
    auto: 300,
    strength: 80
  },
  {
    name: 'border',
    description: 'Border of the element',
    auto: '1px solid #333',
    strength: 100
  },
  {
    name: 'background',
    description: 'Background of the element',
    auto: '#eee',
    strength: 100
  },
  {
    name: 'textAlign',
    description: 'Alignment of the element',
    options: ['left', 'center', 'right'],
    auto: 'center',
    strength: 80
  },
  {
    name: 'fontSize',
    description: 'Sets size of text',
    auto: 24,
    strength: 100
  },
  {
    name: 'padding',
    description: 'Spacing inside an element',
    auto: 10,
    strength: 100
  }
]
