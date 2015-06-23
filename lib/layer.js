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
function Layer(pattern) {
  this._keys = [];
  this.params = {};
  this.regexp = pathToRegexp(pattern,this._keys);
}

/**
 * Layer types
 */
Layer.types = {
  middleware: 0,
  route: 1,
  router: 2
};

Layer.prototype.match = function(path){
  if(path === '/'){
    return true;
  }

  return this.regexp.test(path);
}

/**
 *
 */
layer.dispatch = function * () {

};

/**
 *
 */