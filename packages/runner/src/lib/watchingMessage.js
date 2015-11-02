import keys from '../keys'

export default function watchingMessage() {
  const newLine = "\n"
  const userEditor = (process.env.VISUAL || process.env.EDITOR)

  keys.start()

  console.log(
    newLine +
    ' • O'.cyan.bold + 'pen        '.cyan +
      ' • V'.cyan.bold + 'erbose'.cyan + newLine +
    (userEditor
      ? (' • E'.cyan.bold + 'dit        '.cyan)
      : '               ') +
        ' • I'.cyan.bold + 'nstall (npm)'.cyan + newLine
    // ' • U'.blue.bold + 'pload'.blue + newLine
  )

  keys.resume()
}