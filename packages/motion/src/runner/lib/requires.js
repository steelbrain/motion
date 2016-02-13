// this optimizes startup a bit by not requiring things until necessary

let cache = {}

let REQUIRE = eval('require')

function get(name) {
  cache[name] = cache[name] || REQUIRE(name)
  return cache[name]
}

export default {
  webpack: () => get('webpack'),
  babel: () => get('flint-babel-core'),
  surge: () => get('surge'),
}