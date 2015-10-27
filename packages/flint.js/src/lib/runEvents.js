export default function runEvents(queue, name) {
  console.log('run', name, queue[name])

  if (queue && queue[name] && queue[name].length) {
    queue[name].forEach(e => e())
  }

}