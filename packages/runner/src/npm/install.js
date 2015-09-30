import exec from '../lib/exec'

// npm install
export default function(dir, cb) {
  console.log('Installing npm packages...')
  exec('npm install', dir, () => cb && cb())
}