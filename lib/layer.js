/**
 * module dependencies
 */
var pathToRegexp = require('path-to-regexp');

/**
 * do exports
 */
module.exports = Layer;

/**
 * Layer class definition
 */
function Layer(path, options, handler) {
  if (!(this instanceof Layer)) {
    return new Layer(path, options, handler);
  }

  // will present after match
  this.path = undefined;
  this.params = undefined;

  // setup regex
  this.regexp = pathToRegexp(path, this.keys = [], options);

  // handler*(next)
  this.handler = handler;
}

Layer.prototype.match = function(path) {
  var m = this.regexp.exec(path);
  if (!m) {
    return false;
  }

  // m = [full,group1...groupN]
  this.path = m[0];
  this.params = {};
  var n = 0; // store the anaymous params

  for (var i = 0, len = this.keys.length; i < len; i++) {
    var name = this.keys[i].name || n++;
    var val = m[i + 1];
    this.params[name] = decode_param(val);
  }

  return true;
};

function decode_param(val) {
  if (typeof val !== 'string') {
    return val;
  }

  try {
    return decodeURIComponent(val);
  }
  catch (e) {
    var err = new TypeError("Failed to decode param '" + val + "'");
    err.status = 400;
    throw err;
  }
}