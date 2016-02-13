// Pre- and post-action hooks for Surge

import Program from 'commander'
import colors from 'colors'
import fs from 'fs'
import path from 'path'

export default {
  preAuth(req, resume) {
    resume()
  },

  postAuth(req, resume) {
    resume()
  },

  preProject(req, resume) {
    fs.stat(process.cwd() + '/.flint', function(err, res) {
      var buildDir = path.resolve(process.cwd(), '.flint', 'build')

      if (err || !res) {
        console.log("\nRun 'flint build' in a flint repo to build your app first.".green.bold)
      }

      /**
       * Do the Flint compile step here!
       * This is an example where we create
       * a new `200.html` file if there isn’t one,
       * where client side routing
       * and then publish it to Surge.
       *
       * You can replace it with your compile step:
       * await runner.build({ once: true })
       */

      fs.writeFile(path.resolve(buildDir, '200.html'), '<h1>Hello Flint on ' + new Date().toJSON() + '</h1>', function (err) {
        if (err) throw err

        /**
         * IMPORTANT
         * We set `req.project` so Surge doesn’t
         * prompt the user for their project dir
         */

        req.project = buildDir
        resume()
      })
    })
  },

  postProject(req, resume) {
    resume()
  },

  preSize(req, resume) {
    resume()
  },

  postSize(req, resume) {
    resume()
  },

  preDomain(req, resume) {
    resume()
  },

  postDomain(req, resume) {
    resume()
  },

  prePublish(req, resume) {
    resume()
  },

  postPublish(req, resume) {
    resume()
  }
}