import keys from '../keys'

export default function watchingMessage() {
  const newLine = "\n"
  const userEditor = (process.env.VISUAL || process.env.EDITOR)

  keys.start()

  const prefix = '•'

  console.log(
    `${prefix} `+'O'.cyan.bold + 'pen     '.cyan +
      `${prefix} `+'V'.bold + 'erbose log' + newLine +
    (userEditor
      ? (`${prefix} `+'E'.cyan.bold + 'ditor   '.cyan)
      : '           ') +
        `${prefix} `+'R'.bold+'efresh packages' + newLine
    // `${prefix} `+'U'.blue.bold + 'pload'.blue + newLine
  )

  keys.resume()
}