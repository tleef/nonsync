var events = require('events');

var nonsync = {};


nonsync.each = function (arr, iterator, callback) {
  callback = callback || noop;
  var emitter = new events.EventEmitter();
  var errors = [];
  if (!arr.length) {
    return callback(errors);
  }
  var completed = 0;
  arr.forEach(function (x, i) {
    iterator(x, once(function(err) {
      if (err) {
        errors[i] = err;
        emitter.emit('err', err);
      }
      completed += 1;
      if (completed >= arr.length) {
        callback(errors);
      }
    }));
  });
  return emitter;
};
nonsync.forEach = nonsync.each;


nonsync.eachSeries = function (arr, iterator, callback) {
  callback = callback || noop;
  var emitter = new events.EventEmitter();
  var errors = [];
  if (!arr.length) {
    return callback(errors);
  }
  var completed = 0;
  var iterate = function () {
    iterator(arr[completed], function (err) {
      if (err) {
        errors[completed] = err;
        emitter.emit('err', err);
      }
      completed += 1;
      if (completed >= arr.length) {
        callback(errors);
      }
      else {
        iterate();
      }
    });
  };
  iterate();
  return emitter;
};
nonsync.forEachSeries = nonsync.eachSeries;


nonsync.eachLimit = function (arr, limit, iterator, callback) {
  var fn = _eachLimit(limit);
  return fn.apply(null, [arr, iterator, callback]);
};
nonsync.forEachLimit = nonsync.eachLimit;

var _eachLimit = function (limit) {

  return function (arr, iterator, callback) {
    callback = callback || noop;
    var emitter = new events.EventEmitter();
    var errors = [];
    if (!arr.length || limit <= 0) {
      return callback(errors);
    }
    var completed = 0;
    var started = 0;
    var running = 0;

    (function replenish () {
      if (completed >= arr.length) {
        return callback(errors);
      }

      while (running < limit && started < arr.length) {
        started += 1;
        running += 1;
        (function (i) {
          iterator(arr[i], function (err) {
            if (err) {
              errors[i] = err;
              emitter.emit('err', err);
            }
            completed += 1;
            running -= 1;
            if (completed >= arr.length) {
              callback(errors);
            }
            else {
              replenish();
            }
          });
        })(started - 1);
      }
    })();
    return emitter;
  };
};



function once(fn) {
  var called = false;
  return function() {
    if (called) throw new Error("Callback was already called.");
    called = true;
    fn.apply(null, arguments);
  }
}

function noop() {}

module.exports = exports = nonsync;