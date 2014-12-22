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

function filterIterator(x, callback) {
  setTimeout(function(){
    callback(x % 2);
  }, x*25);
}

function detectIterator(call_order, x, callback) {
  setTimeout(function(){
    call_order.push(x);
    callback(x == 2);
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
      assert.ok(!errors);
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
      assert.ok(!errors);
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
      assert.ok(!errors);
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
      assert.ok(!errors);
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
    nonsync.map([1,2,3], function(x, callback){
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
    nonsync.map([1,2,3], function(x, callback){
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

});


suite('mapSeries', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.mapSeries([1,3,2], mapIterator.bind(this, call_order), function(errors, results){
      assert.ok(!errors);
      assert.deepEqual(call_order, [1,3,2]);
      assert.deepEqual(results, [2,6,4]);
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.mapSeries([1,2,3], function(x, callback){
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
    nonsync.mapSeries([1,2,3], function(x, callback){
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
    nonsync.mapSeries([1,2,3], function(x, callback){
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

});


suite('mapLimit', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.mapLimit([2,4,3], 2, mapIterator.bind(this, call_order), function(errors, results){
      assert.ok(!errors);
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


suite('reduce', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.reduce([1,2,3], 0, function(a, x, callback){
      call_order.push(x);
      callback(null, a + x);
    }, function(errors, result){
      assert.ok(!errors);
      assert.equal(result, 6);
      assert.deepEqual(call_order, [1,2,3]);
      done();
    });
  });

  test('async with non-reference memo', function(done) {
    nonsync.reduce([1,3,2], 0, function(a, x, callback){
      setTimeout(function(){callback(null, a + x)}, Math.random()*100);
    }, function(errors, result){
      assert.equal(result, 6);
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.reduce([1,2,3], 0, function(a, x, callback){
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
    nonsync.reduce([1,2,3], 0, function(a, x, callback){
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
    nonsync.reduce([1,2,3], 0, function(a, x, callback){
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

  test('inject alias', function(done) {
    assert.strictEqual(nonsync.inject, nonsync.reduce);
    done();
  });

  test('foldl alias', function(done) {
    assert.strictEqual(nonsync.foldl, nonsync.reduce);
    done();
  });

});


suite('reduceRight', function() {

  test('normal', function(done) {
    var call_order = [];
    var a = [1,2,3];
    nonsync.reduceRight(a, 0, function(a, x, callback){
      call_order.push(x);
      callback(null, a + x);
    }, function(errors, result){
      assert.ok(!errors);
      assert.equal(result, 6);
      assert.deepEqual(call_order, [3,2,1]);
      assert.deepEqual(a, [1,2,3]);
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.reduceRight([1,2,3], 0, function(a, x, callback){
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
    nonsync.reduceRight([1,2,3], 0, function(a, x, callback){
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
    nonsync.reduceRight([1,2,3], 0, function(a, x, callback){
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

  test('foldr alias', function(done) {
    assert.strictEqual(nonsync.foldr, nonsync.reduceRight);
    done();
  });

});


suite('filter', function() {

  test('normal', function(done) {
    nonsync.filter([3,1,2], filterIterator, function(results){
      assert.deepEqual(results, [3,1]);
      done();
    });
  });

  test('original untouched', function(done) {
    var a = [3,1,2];
    nonsync.filter(a, function(x, callback){
      callback(x % 2);
    }, function(results){
      assert.deepEqual(results, [3,1]);
      assert.deepEqual(a, [3,1,2]);
      done();
    });
  });

  test('select alias', function(done) {
    assert.strictEqual(nonsync.select, nonsync.filter);
    done();
  });

});


suite('filterSeries', function() {

  test('normal', function(done) {
    nonsync.filterSeries([3,1,2], filterIterator, function(results){
      assert.deepEqual(results, [3,1]);
      done();
    });
  });

  test('selectSeries alias', function(done) {
    assert.strictEqual(nonsync.selectSeries, nonsync.filterSeries);
    done();
  });

});


suite('reject', function(){

  test('normal', function(done) {
    nonsync.reject([3,1,2], filterIterator, function(results){
      assert.deepEqual(results, [2]);
      done();
    });
  });

  test('original untouched', function(done) {
    var a = [3,1,2];
    nonsync.reject(a, function(x, callback){
      callback(x % 2);
    }, function(results){
      assert.deepEqual(results, [2]);
      assert.deepEqual(a, [3,1,2]);
      done();
    });
  });

});


suite('rejectSeries', function() {

  test('normal', function(done) {
    nonsync.rejectSeries([3,1,2], filterIterator, function(results){
      assert.deepEqual(results, [2]);
      done();
    });
  });

});


suite('detect', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.detect([3,2,1], detectIterator.bind(this, call_order), function(result){
      call_order.push('callback');
      assert.equal(result, 2);
    });
    setTimeout(function(){
      assert.deepEqual(call_order, [1,2,'callback',3]);
      done();
    }, 100);
  });

  test('multiple matches', function(done) {
    var call_order = [];
    nonsync.detect([3,2,2,1,2], detectIterator.bind(this, call_order), function(result){
      call_order.push('callback');
      assert.equal(result, 2);
    });
    setTimeout(function(){
      assert.deepEqual(call_order, [1,2,'callback',2,2,3]);
      done();
    }, 100);
  });

});


suite('detectSeries', function() {

  test('normal', function(done) {
    var call_order = [];
    nonsync.detectSeries([3,2,1], detectIterator.bind(this, call_order), function(result){
      call_order.push('callback');
      assert.equal(result, 2);
    });
    setTimeout(function(){
      assert.deepEqual(call_order, [3,2,'callback']);
      done();
    }, 200);
  });

  test('multiple matches', function(done) {
    var call_order = [];
    nonsync.detectSeries([3,2,2,1,2], detectIterator.bind(this, call_order), function(result){
      call_order.push('callback');
      assert.equal(result, 2);
    });
    setTimeout(function(){
      assert.deepEqual(call_order, [3,2,'callback']);
      done();
    }, 200);
  });

});


suite('some', function() {

  test('true', function(done) {
    nonsync.some([3,1,2], function(x, callback){
      setTimeout(function(){callback(x === 1);}, 10);
    }, function(result){
      assert.equal(result, true);
      done();
    });
  });

  test('false', function(done) {
    nonsync.some([3,1,2], function(x, callback){
      setTimeout(function(){callback(x === 10);}, 10);
    }, function(result){
      assert.equal(result, false);
      done();
    });
  });

  test('early return', function(done) {
    var call_order = [];
    nonsync.some([1,2,3], function(x, callback){
      setTimeout(function(){
        call_order.push(x);
        callback(x === 1);
      }, x*25);
    }, function(){
      call_order.push('callback');
    });
    setTimeout(function(){
      assert.deepEqual(call_order, [1,'callback',2,3]);
      done();
    }, 100);
  });

  test('any alias', function(done) {
    assert.strictEqual(nonsync.any, nonsync.some);
    done();
  })

});


suite('every', function() {

  test('true', function(done) {
    nonsync.every([1,2,3], function(x, callback){
      setTimeout(function(){callback(true);}, 10);
    }, function(result){
      assert.equal(result, true);
      done();
    });
  });

  test('false', function(done) {
    nonsync.every([1,2,3], function(x, callback){
      setTimeout(function(){callback(x % 2);}, 10);
    }, function(result){
      assert.equal(result, false);
      done();
    });
  });

  test('early return', function(done) {
    var call_order = [];
    nonsync.every([1,2,3], function(x, callback){
      setTimeout(function(){
        call_order.push(x);
        callback(x === 1);
      }, x*25);
    }, function(){
      call_order.push('callback');
    });
    setTimeout(function(){
      assert.deepEqual(call_order, [1,2,'callback',3]);
      done();
    }, 100);
  });

  test('all alias', function(done) {
    assert.strictEqual(nonsync.all, nonsync.every);
    done();
  })

});


suite('sortBy', function() {

  test('normal', function(done) {
    nonsync.sortBy([{a:1},{a:16},{a:7}], function(x, callback){
      setTimeout(function(){callback(null, x.a);}, 10);
    }, function(errors, result){
      assert.ok(!errors);
      assert.deepEqual(result, [{a:1},{a:7},{a:16}]);
      done();
    });
  });

  test('inverted', function(done) {
    nonsync.sortBy([{a:1},{a:16},{a:7}], function(x, callback){
      setTimeout(function(){callback(null, x.a*-1);}, 10);
    }, function(errors, result){
      assert.deepEqual(result, [{a:16},{a:7},{a:1}]);
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    nonsync.sortBy([{a:1},{a:16},{a:7}], function(x, callback){
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
    nonsync.sortBy([{a:1},{a:16},{a:7}], function(x, callback){
      setTimeout(function() {x.a % 2 === 1 ? callback('error') : callback(); }, 10);
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
    nonsync.sortBy([{a:1},{a:16},{a:7}], function(x, callback){
      setTimeout(function() {x.a % 2 === 0 ? callback('error') : callback(); }, 10);
    }, function(errors){
      assert.deepEqual(errors, expected);
      assert.equal(count, 1);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

});


suite('concat', function() {

  test('normal', function(done) {
    var call_order = [];
    var iterator = function (x, cb) {
      setTimeout(function(){
        call_order.push(x);
        var r = [];
        while (x > 0) {
          r.push(x);
          x--;
        }
        cb(null, r);
      }, x*25);
    };
    nonsync.concat([1,3,2], iterator, function(errors, results){
      assert.deepEqual(results, [1,2,1,3,2,1]);
      assert.deepEqual(call_order, [1,2,3]);
      assert.ok(!errors);
      done();
    });
  });

  test('error all', function(done) {
    var count = 0;
    var iterator = function (x, callback) {
      setTimeout(function() { callback('error') }, 10);
    };
    nonsync.concat([1,2,3], iterator, function(errors){
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
    var iterator = function (x, callback) {
      setTimeout(function() { x % 2 === 1 ? callback('error') : callback(); }, 10);
    };
    nonsync.concat([1,2,3], iterator, function(errors){
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
    var iterator = function (x, callback) {
      setTimeout(function() { x % 2 === 0 ? callback('error') : callback(); }, 10);
    };
    nonsync.concat([1,2,3], iterator, function(errors){
      assert.deepEqual(errors, expected);
      assert.equal(count, 1);
      done();
    }).on('err', function(err) {
      assert.equal(err, 'error');
      count++;
    });
  });

});


suite('concatSeries', function() {

  test('normal', function(done) {
    var call_order = [];
    var iterator = function (x, cb) {
      setTimeout(function(){
        call_order.push(x);
        var r = [];
        while (x > 0) {
          r.push(x);
          x--;
        }
        cb(null, r);
      }, x*25);
    };
    nonsync.concatSeries([1,3,2], iterator, function(errors, results){
      assert.deepEqual(results, [1,3,2,1,2,1]);
      assert.deepEqual(call_order, [1,3,2]);
      assert.ok(!errors);
      done();
    });
  });

});
