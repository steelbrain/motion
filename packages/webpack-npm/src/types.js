/* @flow */

export type Installer$Config = {
  save?: boolean,
  development?: boolean,
  onStarted?: ((jobID: number, dependencies: Array<Array<string>>) => any),
  onProgress?: ((jobID: number, name: string, error: ?Error) => any),
  onComplete?: ((jobID: number) => any)
}

export type Compiler = Object
export type Factory = Object
export type Result = Object
