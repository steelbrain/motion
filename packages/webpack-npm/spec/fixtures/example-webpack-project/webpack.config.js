module.exports = {
  entry: './entry.js',
  output: {
    path: __dirname,
    filename: './bundle.js'
  },
  plugins: [
    new (require('../../../'))({
      onStarted(id, versions) {
        console.log('started', id, versions)
      },
      onProgress(id, name, error) {
        console.log('progress', id, name, error)
      },
      onComplete(id) {
        console.log('complete', id)
      }
    })
  ],
  cache: false
}
