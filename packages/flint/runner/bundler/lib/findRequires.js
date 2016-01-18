import getMatches from './getMatches'

export const findRequires = source => getMatches(source, /require\(\s*['"]([^\'\"]+)['"]\s*\)/g, 1) || []
export const findExternalRequires = source => findRequires(source).filter(x => x.charAt(0) != '.')