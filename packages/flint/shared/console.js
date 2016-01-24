var clc      = {},
    sprintf  = require('util').format;

var helpers = {

  // Make a console spinner.
  // Code based on code from Mocha by Visionmedia/Tj
  // https://github.com/visionmedia/mocha/blob/master/bin/_mocha
  Spinner: function (message) {
    var spinnerMessage = message;

    this.start = function (opts) {
      var opts = opts || {};
      var self = this;
      var spinner = 'win32' == process.platform ? ['|','/','-','\\'] : ['◜','◠','◝','◞','◡','◟'];

      function play(arr, interval) {
        var len = arr.length, i = 0;
        interval = interval || 100;

        var drawTick = function () {
          var str = arr[i++ % len];
          process.stdout.write('\u001b[0G' + str + '\u001b[90m' + spinnerMessage + '\u001b[0m');
        };

        self.timer = setInterval(drawTick, interval);
      }

      var frames = spinner.map(function(c) {
        return sprintf('  \u001b[96m%s ', c);
      });

      play(frames, opts.fps || 50)
    };

    this.message = function (message) {
      spinnerMessage = message;
    };

    this.stop = function () {
      process.stdout.write('\u001b[0G\u001b[2K');
      clearInterval(this.timer);
    };
  },

  // Make an ascii horizontal gauge
  Gauge: function (value, maxValue, width, dangerZone, suffix) {
    if(maxValue === 0)
    {
      return '[]';
    }
    else
    {
      var barLength = Math.ceil(value/maxValue*width);
      if(barLength > width)
        barLength = width;

      var barColor = clc.green;
      if(value > dangerZone)
        barColor = clc.red;

      return '['+
        barColor(Array(barLength).join("|")) +  //The filled portion
        Array(width+1-barLength).join("-") +    //The empty portion
      '] ' + clc.blackBright(suffix);
    }
  },

  // Make a progress bar
  Progress: function (width) {
    var currentValue = 0;
    var maxValue = 0;
    var self = this;

    this.update = function (currentValue, maxValue) {
      if(maxValue === 0)
      {
        return '[]';
      }
      else
      {
        var barLength = Math.ceil(currentValue / maxValue * width);
        if(barLength > width)
          barLength = width;

        return '['+
          clc.green(Array(barLength).join("|")) +  //The filled portion
          Array(width + 1 - barLength).join("-") +    //The empty portion
        '] ' + clc.blackBright(Math.ceil(currentValue / maxValue * 100) + '%');
      }
    };
  },
}

module.exports = helpers