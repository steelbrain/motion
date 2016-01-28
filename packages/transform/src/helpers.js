'use babel'

export function normalizeLocation(location) {
  return [[location.start.line - 1, location.start.column], [location.end.line - 1, location.end.column]]
}
