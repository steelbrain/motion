/* @flow */

export type Config = {
  babel: {
    plugins: Array<string | [string, Object]>,
    presets: Array<string>
  },
  webServerPort: number,
  saveNpmModules: boolean,
  bundleDirectory: string,
  publicDirectory: string,
  includePolyfills: boolean,
}
