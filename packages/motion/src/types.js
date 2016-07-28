/* @flow */

export type Config = {
  babel: {
    plugins: [],
    presets: []
  },
  webServerPort: number,
  saveNpmModules: boolean,
  bundleDirectory: string,
  publicDirectory: string,
  includePolyfills: boolean,
}
