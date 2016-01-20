var Surge = require('surge')
var hooks = require('./hooks')

var surge = Surge({ platform: 'roguemont.com' })

surge.publish(hooks)