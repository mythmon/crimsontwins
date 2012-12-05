var _ = require('underscore');

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
