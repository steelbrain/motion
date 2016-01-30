'use babel'

export default {
  color: {
    description: 'Sets the text color',
    auto: '#333333',
    strength: 100
  },

  margin: {
    description: 'Spacing around an element',
    auto: 10,
    strength: 100
  },

  flexDirection: {
    description: 'Row or Column, sets direction element flows in',
    options: ['row', 'col']
  },

  height: {
    auto: 300,
    strength: 80,
    options: [300, '100%']
  },

  width: {
    auto: 300,
    strength: 80,
    options: [300, '100%']
  },

  border: {
    auto: '1px solid #333',
    strength: 100
  },

  background: {
    auto: '#eee',
    strength: 100
  },

  textAlign: {
    auto: 'center',
    options: ['left', 'center', 'right'],
    strength: 80
  },

  fontSize: {
    description: 'Sets size of text',
    auto: 24,
    strength: 100
  },

  padding: {
    description: 'Spacing inside an element',
    auto: 10,
    strength: 100
  }
}
