import getMatches from './getMatches'

export const findRequires = source => getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []
export const findBabelRuntimeRequires = source => findRequires(source).filter(x => x.indexOf('babel-runtime') == 0)