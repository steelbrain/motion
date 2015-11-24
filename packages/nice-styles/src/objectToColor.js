export default function objectToColor(obj) {
  if (Array.isArray(obj)) {
    if (obj.length == 4)
      return `rgba(${obj[0]}, ${obj[1]}, ${obj[2]}, ${obj[3]})`
    else
      return `rgb(${obj[0]}, ${obj[1]}, ${obj[2]})`
  }
  else {
    if (obj.a)
      return `rgba(${obj.r}, ${obj.g}, ${obj.b}, ${obj.a})`
    else
      return `rgb(${obj.r}, ${obj.g}, ${obj.b})`
  }
}