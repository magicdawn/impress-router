/**
 * module dependencies
 */
var Layer = require('./layer');
var Route = require('./route');
var METHODS = require('methods');
var compose = require('koa-compose');

/**
 * expose `Router` & `Router.prototype`
 */
var proto = module.exports = function Router(options) {

  var router = function * (next) {
    yield router.dispatch(this, next);
  }

  // setup proto
  router.__proto__ = proto;

  // initialize
  router.init(options);

  return router;
};

/**
 * initialize
 */
proto.init = function(options) {
  this.stack = [];
  this.params = {};
};

/**
 * dispatch
 *
 * ctx : koa app's request & response context
 * next: router's next
 */
proto.dispatch = function * (ctx, next) {

};

proto.use = function(path) {
  var middlewares;
  if (typeof path === 'string') {
    middlewares = [].slice.call(arguments, 1);
  }
  else {
    path = '/';
    middlewares = [].slice.call(arguments);
  }

  // handler for layer
  var handler;
  if (middlewares.length === 1) {
    handler = middlewares[0];
  }
  else {
    handler = compose(middlewares);
  }

  var layer = new Layer(path, handler);
  this.stack.push(layer);

  return this;
};

/**
 * add HTTP verb methods
 */
methods.forEach(function(m) {
  proto[m] = function(path) {

  };
});