import exec from '../lib/exec'

// npm install
export default function(dir, cb) {
  exec('npm install', dir, () => cb && cb())
}