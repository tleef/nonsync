var nonsync = require('../lib/nonsync');

var assert = require("assert");

function eachIterator(args, x, callback) {
  setTimeout(function(){
    args.push(x);
    callback();
  }, x*25);
}

function mapIterator(call_order, x, callback) {
  setTimeout(function(){
    call_order.push(x);
    callback(null, x*2);
  }, x*25);
}

function eachNoCallbackIterator(done, x, callback) {
  assert.equal(x, 1);
  callback();
  done();
}


suite('each', function(){

  test('normal', function(done) {
    var args = [];
    nonsync.each([1,3,2], eachIterator.bind(this, args), function(errors) {
      assert.ok(Array.isArray(errors));
      assert.ok(!errors.length);
      assert.deepEqual(args, [1,2,3]);
      done();
    });
  });

  test('extra callback', function(done) {
    var count = 0;
    nonsync.each([1,3,2], function(val, callback) {
      count++;
      callback();
      assert.throws(callback);
      if (count == 3) {
        done();
      }
    });
  });

  test('empty array', function(done) {
    nonsync.each([], function(x, callback){
      assert.ok(false, 'iterator should not be called');
      callback();
    }, function(){
      assert.ok(true, 'should call callback');
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.each([1,2,3], function(x, callback){
      setTimeout(function() { callback('error') }, 10);
    }, function(errors){
      assert.deepEqual(errors, ['error','error','error']);
      assert.equal(count, 3);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error odds', function(done) {
    var count = 0;
    var expected = [];
    expected[0] = 'error';
    expected[2] = 'error';
    nonsync.each([1,2,3], function(x, callback){
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(errors, expected);
      assert.equal(count, 2);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error evens', function(done) {
    var count = 0;
    var expected = [];
    expected[1] = 'error';
    nonsync.each([1,2,3], function(x, callback){
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(errors, expected);
      assert.equal(count, 1);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('no callback', function(done) {
    nonsync.each([1], eachNoCallbackIterator.bind(this, done));
  });

  test('forEach alias', function(done) {
    assert.strictEqual(nonsync.each, nonsync.forEach);
    done();
  });

});


suite('eachSeries', function(){

  test('normal', function(done) {
    var args = [];
    nonsync.eachSeries([1,3,2], eachIterator.bind(this, args), function(errors){
      assert.ok(Array.isArray(errors));
      assert.ok(!errors.length);
      assert.deepEqual(args, [1,3,2]);
      done();
    });
  });

  test('empty array', function(done) {
    nonsync.eachSeries([], function(x, callback){
      assert.ok(false, 'iterator should not be called');
      callback();
    }, function(){
      assert.ok(true, 'should call callback');
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    var call_order = [];
    nonsync.eachSeries([1,2,3], function(x, callback){
      call_order.push(x);
      setTimeout(function() { callback('error') }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [1,2,3]);
      assert.deepEqual(errors, ['error','error','error']);
      assert.equal(count, 3);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error odds', function(done) {
    var count = 0;
    var expected = [];
    expected[0] = 'error';
    expected[2] = 'error';
    var call_order = [];
    nonsync.eachSeries([1,2,3], function(x, callback){
      call_order.push(x);
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [1,2,3]);
      assert.deepEqual(errors, expected);
      assert.equal(count, 2);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error evens', function(done) {
    var count = 0;
    var expected = [];
    expected[1] = 'error';
    var call_order = [];
    nonsync.eachSeries([1,2,3], function(x, callback){
      call_order.push(x);
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [1,2,3]);
      assert.deepEqual(errors, expected);
      assert.equal(count, 1);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('no callback', function(done) {
    nonsync.eachSeries([1], eachNoCallbackIterator.bind(this, done));
  });

  test('forEachSeries alias', function(done) {
    assert.strictEqual(nonsync.eachSeries, nonsync.forEachSeries);
    done();
  });

});


suite('eachLimit', function(){

  test('normal', function(done) {
    var args = [];
    var arr = [0,1,2,3,4,5,6,7,8,9];
    nonsync.eachLimit(arr, 2, function(x,callback){
      setTimeout(function(){
        args.push(x);
        callback();
      }, x*5);
    }, function(errors){
      assert.ok(Array.isArray(errors));
      assert.ok(!errors.length);
      assert.deepEqual(args, arr);
      done();
    });
  });

  test('empty array', function(done) {
    nonsync.eachLimit([], 2, function(x, callback){
      assert.ok(false, 'iterator should not be called');
      callback();
    }, function(){
      assert.ok(true, 'should call callback');
      done();
    });
  });

  test('limit exceeds size', function(done) {
    var args = [];
    var arr = [0,1,2,3,4,5,6,7,8,9];
    nonsync.eachLimit(arr, 20, eachIterator.bind(this, args), function(){
      assert.deepEqual(args, arr);
      done();
    });
  });

  test('limit equal size', function(done) {
    var args = [];
    var arr = [0,1,2,3,4,5,6,7,8,9];
    nonsync.eachLimit(arr, 10, eachIterator.bind(this, args), function(){
      assert.deepEqual(args, arr);
      done();
    });
  });

  test('zero limit', function(done) {
    nonsync.eachLimit([0,1,2,3,4,5], 0, function(x, callback){
      assert.ok(false, 'iterator should not be called');
      callback();
    }, function(){
      assert.ok(true, 'should call callback');
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    var arr = [0,1,2,3,4,5,6,7,8,9];
    var call_order = [];
    nonsync.eachLimit(arr, 3, function(x, callback){
      call_order.push(x);
      setTimeout(function() { callback('error') }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(errors, arr.map(function() { return 'error' }));
      assert.equal(count, 10);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error odds', function(done) {
    var count = 0;
    var arr = [0,1,2,3,4,5,6,7,8,9];
    var expected = [];
    expected[1] = 'error';
    expected[3] = 'error';
    expected[5] = 'error';
    expected[7] = 'error';
    expected[9] = 'error';
    var call_order = [];
    nonsync.eachLimit(arr, 3, function(x, callback){
      call_order.push(x);
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(errors, expected);
      assert.equal(count, 5);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error evens', function(done) {
    var count = 0;
    var arr = [0,1,2,3,4,5,6,7,8,9];
    var expected = [];
    expected[0] = 'error';
    expected[2] = 'error';
    expected[4] = 'error';
    expected[6] = 'error';
    expected[8] = 'error';
    var call_order = [];
    nonsync.eachLimit(arr, 3, function(x, callback){
      call_order.push(x);
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(errors, expected);
      assert.equal(count, 5);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('no callback', function(done) {
    nonsync.eachLimit([1], 1, eachNoCallbackIterator.bind(this, done));
  });

  test('synchronous', function(done) {
    var args = [];
    var arr = [0,1,2];
    nonsync.eachLimit(arr, 5, function(x,callback){
      args.push(x);
      callback();
    }, function(){
      assert.deepEqual(args, arr);
      done();
    });
  });

  test('forEachLimit alias', function(done) {
    assert.strictEqual(nonsync.eachLimit, nonsync.forEachLimit);
    done();
  });

});


suite('map', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.map([1,3,2], mapIterator.bind(this, call_order), function(errors, results){
      assert.ok(Array.isArray(errors));
      assert.ok(!errors.length);
      assert.deepEqual(call_order, [1,2,3]);
      assert.deepEqual(results, [2,6,4]);
      done();
    });
  });

  test('original untouched', function(done) {
    var a = [1,2,3];
    nonsync.map(a, function(x, callback){
      callback(null, x*2);
    }, function(errors, results){
      assert.deepEqual(results, [2,4,6]);
      assert.deepEqual(a, [1,2,3]);
      done();
    });
  });

  test('without main callback', function(done) {
    var a = [1,2,3];
    var r = [];
    nonsync.map(a, function(x, callback){
      r.push(x);
      callback(null);
      if (r.length >= a.length) {
        assert.deepEqual(r, a);
        done();
      }
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.map([1,2,3], function(x, callback){
      setTimeout(function() { callback('error') }, 10);
    }, function(errors, results){
      assert.deepEqual(errors, ['error','error','error']);
      assert.equal(count, 3);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error odds', function(done) {
    var count = 0;
    var expected = [];
    expected[0] = 'error';
    expected[2] = 'error';
    nonsync.map([1,2,3], function(x, callback){
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    }, function(errors, results){
      assert.deepEqual(errors, expected);
      assert.equal(count, 2);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error evens', function(done) {
    var count = 0;
    var expected = [];
    expected[1] = 'error';
    nonsync.map([1,2,3], function(x, callback){
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors, results){
      assert.deepEqual(errors, expected);
      assert.equal(count, 1);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

});


suite('mapSeries', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.mapSeries([1,3,2], mapIterator.bind(this, call_order), function(errors, results){
      assert.ok(Array.isArray(errors));
      assert.ok(!errors.length);
      assert.deepEqual(call_order, [1,3,2]);
      assert.deepEqual(results, [2,6,4]);
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.mapSeries([1,2,3], function(x, callback){
      setTimeout(function() { callback('error') }, 10);
    }, function(errors, results){
      assert.deepEqual(errors, ['error','error','error']);
      assert.equal(count, 3);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error odds', function(done) {
    var count = 0;
    var expected = [];
    expected[0] = 'error';
    expected[2] = 'error';
    nonsync.mapSeries([1,2,3], function(x, callback){
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    }, function(errors, results){
      assert.deepEqual(errors, expected);
      assert.equal(count, 2);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error evens', function(done) {
    var count = 0;
    var expected = [];
    expected[1] = 'error';
    nonsync.mapSeries([1,2,3], function(x, callback){
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors, results){
      assert.deepEqual(errors, expected);
      assert.equal(count, 1);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

});


suite('mapLimit', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.mapLimit([2,4,3], 2, mapIterator.bind(this, call_order), function(errors, results){
      assert.ok(Array.isArray(errors));
      assert.ok(!errors.length);
      assert.deepEqual(call_order, [2,4,3]);
      assert.deepEqual(results, [4,8,6]);
      done();
    });
  });

  test('empty array', function(done) {
    nonsync.mapLimit([], 2, function(x, callback){
      assert.ok(false, 'iterator should not be called');
      callback();
    }, function(){
      assert.ok(true, 'should call callback');
      done();
    });
  });

  test('limit exceeds size', function(done) {
    var call_order = [];
    nonsync.mapLimit([0,1,2,3,4,5,6,7,8,9], 20, mapIterator.bind(this, call_order), function(err, results){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(results, [0,2,4,6,8,10,12,14,16,18]);
      done();
    });
  });

  test('limit equals size', function(done) {
    var call_order = [];
    nonsync.mapLimit([0,1,2,3,4,5,6,7,8,9], 10, mapIterator.bind(this, call_order), function(err, results){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(results, [0,2,4,6,8,10,12,14,16,18]);
      done();
    });
  });

  test('zero limit', function(done) {
    nonsync.mapLimit([0,1,2,3,4,5], 0, function(x, callback){
      test.ok(false, 'iterator should not be called');
      callback();
    }, function(err, results){
      assert.deepEqual(results, []);
      assert.ok(true, 'should call callback');
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    var arr = [0,1,2,3,4,5,6,7,8,9];
    var call_order = [];
    nonsync.mapLimit(arr, 3, function(x, callback){
      call_order.push(x);
      setTimeout(function() { callback('error') }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(errors, arr.map(function() { return 'error' }));
      assert.equal(count, 10);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error odds', function(done) {
    var count = 0;
    var arr = [0,1,2,3,4,5,6,7,8,9];
    var expected = [];
    expected[1] = 'error';
    expected[3] = 'error';
    expected[5] = 'error';
    expected[7] = 'error';
    expected[9] = 'error';
    var call_order = [];
    nonsync.mapLimit(arr, 3, function(x, callback){
      call_order.push(x);
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(errors, expected);
      assert.equal(count, 5);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

  test('error evens', function(done) {
    var count = 0;
    var arr = [0,1,2,3,4,5,6,7,8,9];
    var expected = [];
    expected[0] = 'error';
    expected[2] = 'error';
    expected[4] = 'error';
    expected[6] = 'error';
    expected[8] = 'error';
    var call_order = [];
    nonsync.mapLimit(arr, 3, function(x, callback){
      call_order.push(x);
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(call_order, [0,1,2,3,4,5,6,7,8,9]);
      assert.deepEqual(errors, expected);
      assert.equal(count, 5);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

});
