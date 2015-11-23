export default function runEvents(queue, name, args) {
  if (queue && queue[name] && queue[name].length) {
    queue[name].forEach(e => e.apply(this, args))
  }
}