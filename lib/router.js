/**
 * module dependencies
 */
var Layer = require('./layer');
var Route = require('./route');
var METHODS = require('methods');
var compose = require('koa-compose');
var debug = require('debug')('impress-router:router');
var _ = require('lodash');

/**
 * expose `Router` & `Router.prototype`
 */
var proto = module.exports = function Router(options) {

  // router options
  this.options = _.merge({
    goNext: true, // default go next
    strict: false,
    sensitive: false
  }, options);

  // router definition
  var router = function * (next) {
    yield router.dispatch(this);
    if (goNext) {
      yield next;
    }
  };

  // keep constructor `GeneratorFunction` reference
  var GenFn = router.constructor;

  // setup proto
  router.__proto__ = proto;

  // restore constructor,or koa will raise error
  router.constructor = GenFn;

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

  // setup originalPath
  // take it from `ctx.path` for the first time
  // it's happens once over the request pipe line
  ctx.originalPath = ctx.originalPath || ctx.path;

  // save basePath reference at start of `Router#dispatch`
  var basePath = ctx.basePath = ctx.basePath || '';

  yield find_next();

  // restore basePath at end of `Router#dispatch`
  ctx.basePath = basePath;

  function * find_next() {
    var layer;
    while (index < router.stack.length) {
      layer = router.stack[index];

      if (layer.match(ctx.path)) {
        break;
      } else {
        index++;

        // if no layer match
        // we just pass the router
        if (index === router.stack.length) {
          return;
        } else {
          continue;
        }
      }
    }

    // keep reference
    var path_before_layer = ctx.path;
    var base_before_layer = ctx.basePath;

    // not a route
    if (!layer.route) {
      ctx.basePath = ctx.basePath + layer.path;
    }

    // trim path
    ctx.path = ctx.originalPath.substr(ctx.basePath.length);

    // traverse the layer
    // then do restore stuff
    // then find_next()
    yield layer.handle(ctx);

    // restore
    ctx.path = path_before_layer;
    ctx.basePath = base_before_layer;

    // next
    yield find_next();
  }
};

/**
 * use a middleware
 */
proto.use = function(path) {
  var middlewares;
  if (typeof path === 'string') {
    middlewares = [].slice.call(arguments, 1);
  } else {
    path = '/';
    middlewares = [].slice.call(arguments);
  }

  // function*(next)
  var fn;
  if (middlewares.length === 1) {
    fn = middlewares[0];
  } else {
    fn = compose(middlewares);
  }

  var layer = new Layer(path, {
    end: false,
    strict: this.options.strict,
    sensitive: this.options.sensitive
  }, fn);

  this.stack.push(layer);
  return this;
};

proto.route = function(path) {
  var route = new Route(path);

  // `route.dispatch` as `layer.handler` will be called `this = ctx`
  var layer = new Layer(path, {
    strict: this.options.strict,
    sensitive: this.options.sensitive,
    end: true,
  }, route.dispatch);

  layer.route = route;
  this.stack.push(layer);

  return route;
};


/**
 * add HTTP verb methods
 */
METHODS.forEach(function(m) {
  proto[m] = function(path) {
    var route = this.route(path);
    route[m].apply(route, [].slice.call(arguments));
    return this; // return router
  };
});

proto.del = proto['delete'];