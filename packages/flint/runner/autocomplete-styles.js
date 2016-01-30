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
    options: ['row', 'col']
  },
  {
    name: 'height',
    auto: 300,
    strength: 80,
    options: [300, '100%']
  },
  {
    name: 'width',
    auto: 300,
    strength: 80,
    options: [300, '100%']
  },
  {
    name: 'border',
    auto: '1px solid #333',
    strength: 100
  },
  {
    name: 'background',
    auto: '#eee',
    strength: 100
  },
  {
    name: 'textAlign',
    auto: 'center',
    options: ['left', 'center', 'right'],
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
