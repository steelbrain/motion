import hostile from 'hostile'

// ask for preferred url and set /etc/hosts
export default function askForUrlPreference(cb) {
  return new Promise((res, rej) => {
    // var promptly = require('promptly');
    var askCounter = 'Run on ' + OPTS.url + '?';

    // promptly.prompt(askCounter, {}, function(err, val) {
    /*
      var useFriendly = false; // val == 'y';
      if (useFriendly) hostile.set('127.0.0.1', OPTS.url)
      res(useFriendly)
    */
    res(false)
    // });
  })
}