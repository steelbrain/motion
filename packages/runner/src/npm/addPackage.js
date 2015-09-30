import exec from '../lib/exec'

export default function(dir, name, cb) {
  // npm install
  console.log('installing package', name)

  exec('npm install --save ' + name, dir, function() {
    console.log('installed', name)
    cb();
  })
}