/**
 * module dependencies
 */
var pathToRegexp = require('path-to-regexp');
var debug = require('debug')('impress:layer');

/**
 * do exports
 */
module.exports = Layer;

/**
 * Layer class definition
 */
function Layer(path, options, fn) {
  if (!(this instanceof Layer)) {
    return new Layer(path, options, fn);
  }

  // setup regex
  this.regexp = pathToRegexp(path, this.keys = [], options);

  // fn*(next)
  this.fn = fn;
  this.name = fn.name || '<anonymous>';

  // will present after match
  this.path = '';
  this.params = {};

  if (path === '/' && options.end === false) {
    this.regexp.fast_slash = true;
  }
}

Layer.prototype.match = function(path) {
  if (!path) {
    return false;
  }

  if (this.regexp.fast_slash) {
    return true;
  }

  var m = this.regexp.exec(path);
  if (!m) {
    return false;
  }

  // m = [full,group1...groupN]
  this.path = m[0];
  this.params = {};
  var n = 0; // store the anaymous params

  for (var i = 0, len = this.keys.length; i < len; i++) {
    var key = this.keys[i].name || n++;
    var val = m[i + 1];
    this.params[key] = decode_param(val);
  }

  return true;
};

function decode_param(val) {
  if (typeof val !== 'string') {
    return val;
  }

  /* istanbul ignore next */
  try {
    return decodeURIComponent(val);
  } catch (e) {
    var err = new TypeError("Failed to decode param '" + val + "'");
    err.status = 400;
    throw err;
  }
}