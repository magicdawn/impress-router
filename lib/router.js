/**
 * module dependencies
 */
var Layer = require('./layer');
var Route = require('./route');
var Methods = require('methods');
var compose = require('koa-compose');
var debug = require('debug')('impress-router:router');

/**
 * expose `Router` & `Router.prototype`
 */
var proto = module.exports = function Router(options) {

  var router = function * (next) {
    yield router.dispatch(this);
    yield next;
  };

  // keep constructor reference
  var con = router.constructor;

  // setup proto
  router.__proto__ = proto;

  // restore constructor,or koa will assert error
  router.constructor = con;

  // initialize
  router.init(options);

  return router;
};

/**
 * initialize
 */
proto.init = function(options) {
  this.options = options = options || {};
  this.options.strict = options.strict || false;
  this.options.sensitive = options.sensitive || false;

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

  // setup
  ctx.originalPath = ctx.originalPath || ctx.path;
  var basePath = ctx.basePath = ctx.basePath || '';

  yield find_next();

  // restore
  ctx.basePath = basePath;

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
    yield layer.handler.call(ctx, function * () {
      ctx.path = path_before_layer;
      ctx.basePath = base_before_layer;
      yield find_next();
    });
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


  // function*(next)
  var handler;
  if (middlewares.length === 1) {
    handler = middlewares[0];
  }
  else {
    handler = compose(middlewares);
  }

  var layer = new Layer(path, {
    end: false,
    strict: this.options.strict,
    sensitive: this.options.sensitive
  }, handler);

  this.stack.push(layer);
  return this;
};

proto.route = function(path) {
  var route = new Route(path);
  var layer = new Layer(path, {
    strict: this.options.strict,
    sensitive: this.options.sensitive,
    end: true;
  }, route.dispatch.bind(route));
  layer.route = route;

  this.stack.push(layer);
  return route;
};

/**
 * add HTTP verb methods
 */
Methods.forEach(function(m) {
  proto[m] = function(path) {
    var route = this.route(path);
    route[m].apply(route, [].slice.call(arguments));
    return this;
  };
});

proto.del = proto['delete'];