import Radium from 'flint-radium'

export default function ConfiguredRadium(component) {
  return Radium({
    plugins: [
      Radium.Plugins.resolveMediaQueries,
      Radium.Plugins.resolveInteractionStyles,
      Radium.Plugins.prefix,
    ],
  })(component)
}