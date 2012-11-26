exports.async = function async(func, args) {
  args = Array.prototype.slice.call(arguments, 1);
  setTimeout(function() {
    func.apply(this, args);
  }, 0);
};
