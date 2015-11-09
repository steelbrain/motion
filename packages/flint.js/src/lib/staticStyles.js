export default function(name, tagToClass, stylesheet) {
  // console.log(name, tagToClass, stylesheet)

  let style = document.createElement('style')
  style.appendChild(document.createTextNode(stylesheet))
  document.body.appendChild(style)

  this.styleClasses[name] = tagToClass
}