// this optimizes startup a bit by not requiring things until necessary

let cache = {}

export function webpack() {
  cache.webpack = cache.webpack || require('webpack')
  return cache.webpack
}

export function babel() {
  cache.babel = cache.babel || require('flint-babel-core')
  return cache.babel
}