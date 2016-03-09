module.exports = {
  entry: './entry.js',
  output: {
    path: __dirname,
    filename: './bundle.js'
  },
  plugins: [
    new (require('../../../'))({
      onStarted: function(id, versions) {
        console.log('started', id, versions)
      },
      onProgress: function(id, name, error) {
        console.log('progress', id, name, error)
      },
      onComplete: function(id) {
        console.log('complete', id)
      }
    })
  ],
  cache: false
};
