// normalized flint extension, turning jsf -> js
export default function(file) {
  if (!file) return ''
  let dots = file.split('.')
  if (dots[dots.length - 1] === 'jsf') dots[dots.length - 1] = 'js'
  return dots.join('.')
}
