var _ = require('underscore');

var utils = require('./utils');

exports.async = function async(func, args) {
  args = Array.prototype.slice.call(arguments, 1);
  setTimeout(function() {
    func.apply(this, args);
  }, 0);
};

exports.shuffle = function(arr) {
    arr = _.clone(arr);
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    return arr;
};

/* Python new-style string formatting.
 * > "Hello, {0}.".format('Mike');
 * Hello, Mike.
 * > "How is the weather in {citi}?".format({city: 'Mountain View'})
 * How is the weather in Mountain View?
 */
String.prototype.format = function(obj) {
  var args = arguments;
  var str = this;
  // Support either an object, or a series.
  return str.replace(/\{[\w\d\._-]+\}/g, function(part) {
    // Strip off {}.
    part = part.slice(1, -1);
    var index = parseInt(part, 10);
    if (isNaN(index)) {
      return exports.dottedGet(obj, part);
    } else {
      return args[index];
    }
  });
};

exports.dottedGet = function(obj, selector) {
  selector = selector.split('.');
  while (selector.length) {
    obj = obj[selector.splice(0, 1)[0]];
  }
  return obj;
};

(function() {
  var _nextId = 0;
  exports.getId = function() {
    return _nextId++;
  };
})();

exports.eventRelay = function(from, to, name) {
  from.on(name, function() {
    var args = Array.prototype.slice.call(arguments);
    args = [name].concat(args);
    to.emit.apply(to, args);
  });
};