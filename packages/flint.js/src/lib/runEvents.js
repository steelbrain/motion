export default function runEvents(queue, name) {
  if (queue && queue[name] && queue[name].length) {
    queue[name].forEach(e => e())
  }

}