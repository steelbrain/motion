/* @flow */

export type Color = [string, string, string] | [string, string, string, string] | {
  r: string,
  g: string,
  b: string,
} | {
  r: string,
  g: string,
  b: string,
  b: string,
}

export type Transform = {
  x: number | string,
  y: number | string,
  z: number | string,
}
