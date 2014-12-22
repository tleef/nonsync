var events = require('events');

var nonsync = {};


nonsync.each = function (arr, iterator, callback) {
  callback = callback || noop;
  var emitter = new events.EventEmitter();
  var errors = null;
  if (!arr.length) {
    return callback(errors);
  }
  var completed = 0;
  arr.forEach(function (x, i) {
    iterator(x, once(function(err) {
      if (err) {
        if (!errors) errors = [];
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
  var errors = null;
  if (!arr.length) {
    return callback(errors);
  }
  var completed = 0;
  var iterate = function () {
    iterator(arr[completed], function (err) {
      if (err) {
        if (!errors) errors = [];
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
    var errors = null;
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
              if (!errors) errors = [];
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


var doParallel = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return fn.apply(null, [nonsync.each].concat(args));
  };
};
var doParallelLimit = function(limit, fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return fn.apply(null, [_eachLimit(limit)].concat(args));
  };
};
var doSeries = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return fn.apply(null, [nonsync.eachSeries].concat(args));
  };
};

var _asyncMap = function (eachfn, arr, iterator, callback) {
  arr = arr.map(function (x, i) {
    return {index: i, value: x};
  });
  if (!callback) {
    return eachfn(arr, function (x, callback) {
      iterator(x.value, function (err) {
        callback(err);
      });
    });
  }
  var results = [];
  return eachfn(arr, function (x, callback) {
    iterator(x.value, function (err, v) {
      results[x.index] = v;
      callback(err);
    });
  }, function (errors) {
    callback(errors, results);
  });
};

nonsync.map = doParallel(_asyncMap);
nonsync.mapSeries = doSeries(_asyncMap);
nonsync.mapLimit = function (arr, limit, iterator, callback) {
  return _mapLimit(limit)(arr, iterator, callback);
};

var _mapLimit = function(limit) {
  return doParallelLimit(limit, _asyncMap);
};


// reduce only has a series version, as doing reduce in parallel won't
// work in many situations.
nonsync.reduce = function (arr, memo, iterator, callback) {
  return nonsync.eachSeries(arr, function (x, callback) {
    iterator(memo, x, function (err, v) {
      memo = v;
      callback(err);
    });
  }, function (errors) {
    callback(errors, memo);
  });
};
// inject alias
nonsync.inject = nonsync.reduce;
// foldl alias
nonsync.foldl = nonsync.reduce;

nonsync.reduceRight = function (arr, memo, iterator, callback) {
  var reversed = arr.map(function (x) {
    return x;
  }).reverse();
  return nonsync.reduce(reversed, memo, iterator, callback);
};
// foldr alias
nonsync.foldr = nonsync.reduceRight;


var _filter = function (eachfn, arr, iterator, callback) {
  var results = [];
  arr = arr.map(function (x, i) {
    return {index: i, value: x};
  });
  return eachfn(arr, function (x, callback) {
    iterator(x.value, function (v) {
      if (v) {
        results.push(x);
      }
      callback();
    });
  }, function () {
    callback(results.sort(function (a, b) {
      return a.index - b.index;
    }).map(function (x) {
      return x.value;
    }));
  });
};
nonsync.filter = doParallel(_filter);
nonsync.filterSeries = doSeries(_filter);
// select alias
nonsync.select = nonsync.filter;
nonsync.selectSeries = nonsync.filterSeries;


var _reject = function (eachfn, arr, iterator, callback) {
  var results = [];
  arr = arr.map(function (x, i) {
    return {index: i, value: x};
  });
  return eachfn(arr, function (x, callback) {
    iterator(x.value, function (v) {
      if (!v) {
        results.push(x);
      }
      callback();
    });
  }, function () {
    callback(results.sort(function (a, b) {
      return a.index - b.index;
    }).map(function (x) {
      return x.value;
    }));
  });
};
nonsync.reject = doParallel(_reject);
nonsync.rejectSeries = doSeries(_reject);


var _detect = function (eachfn, arr, iterator, main_callback) {
  return eachfn(arr, function (x, callback) {
    iterator(x, function (result) {
      if (result) {
        main_callback(x);
        main_callback = noop;
      }
      else {
        callback();
      }
    });
  }, function () {
    main_callback();
  });
};
nonsync.detect = doParallel(_detect);
nonsync.detectSeries = doSeries(_detect);


nonsync.some = function (arr, iterator, main_callback) {
  return nonsync.each(arr, function (x, callback) {
    iterator(x, function (v) {
      if (v) {
        main_callback(true);
        main_callback = noop;
      }
      callback();
    });
  }, function () {
    main_callback(false);
  });
};
// any alias
nonsync.any = nonsync.some;


nonsync.every = function (arr, iterator, main_callback) {
  return nonsync.each(arr, function (x, callback) {
    iterator(x, function (v) {
      if (!v) {
        main_callback(false);
        main_callback = noop;
      }
      callback();
    });
  }, function () {
    main_callback(true);
  });
};
// all alias
nonsync.all = nonsync.every;


nonsync.sortBy = function (arr, iterator, callback) {
  return nonsync.map(arr, function (x, callback) {
    iterator(x, function (err, criteria) {
      if (err) {
        callback(err);
      }
      else {
        callback(null, {value: x, criteria: criteria});
      }
    });
  }, function (errors, results) {
    if (errors) {
      return callback(errors);
    }
    else {
      var fn = function (left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      };
      callback(null, results.sort(fn).map(function (x) {
        return x.value;
      }));
    }
  });
};


var _concat = function (eachfn, arr, fn, callback) {
  var r = [];
  return eachfn(arr, function (x, cb) {
    fn(x, function (err, y) {
      r = r.concat(y || []);
      cb(err);
    });
  }, function (err) {
    callback(err, r);
  });
};
nonsync.concat = doParallel(_concat);
nonsync.concatSeries = doSeries(_concat);


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