/**
 * module dependencies
 */
var Layer = require('./layer');
var Route = require('./route');
var METHODS = require('methods');
var compose = require('koa-compose');
var debug = require('debug')('impress-router:router');

/**
 * expose `Router` & `Router.prototype`
 */
var proto = module.exports = function Router(options) {

  var router = function * (next) {
    yield router.dispatch(this);
    yield next;
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

  return this;
};

/**
 * dispatch
 *
 * ctx : koa app's request & response context
 */
proto.dispatch = function * (ctx) {

  var router = this;
  var index = 0;

  yield find_next();

  function * find_next() {
    var layer;
    while (index < router.stack.length) {
      layer = router.stack[index];

      if (layer.match(ctx.path)) {
        break;
      }
      else {
        index++;
        continue;
      }
    }

    if (layer) {
      // trim path
      ctx.originalPath = ctx.path;

      // traverse the layer
      // then recover context.path
      // then find_next()
      yield layer.handler.call(ctx, function * () {
        ctx.path = ctx.originalPath;
        delete ctx.originalPath;
        yield find_next();
      });
    }
  }
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
  //
  // function* (next){
  //  blabla ...
  // }
  //
  var handler;
  if (middlewares.length === 1) {
    handler = middlewares[0];
  }
  else {
    handler = compose(middlewares);
  }

  var layer = new Layer(path, handler);
  layer.type = Layer.types.middleware;

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