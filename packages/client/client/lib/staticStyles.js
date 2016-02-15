export default function staticStyles(name, tagToClass, object) {
  this.styleClasses[name] = tagToClass
  this.styleObjects[name] = object
}