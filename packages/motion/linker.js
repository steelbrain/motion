require('shelljs/global')

cd('node_modules')

const pundles = ls('pundle*')

cd ('..')

pundles.forEach(name => {
  exec(`npm link ${name}`)
})
