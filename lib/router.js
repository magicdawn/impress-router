'use strict';

/**
 * module dependencies
 */
var Layer = require('./layer');
var Route = require('./route');
var METHODS = require('methods');
var compose = require('koa-compose');
var debug = require('debug')('impress:router');
var _ = require('lodash');

/**
 * expose `Router` & `Router.prototype`
 */
var proto = module.exports = function Router(options) {

  // router definition
  // add an `impressRouter` name
  var router = function* impressRouter(next) {
    yield * router.dispatch(this);
    if (router.options.goNext) {
      yield * next;
    }
  };

  // router options
  router.options = _.merge({
    goNext: true, // default go next
    strict: false,
    sensitive: false,
    mergeParams: true
  }, options);

  // keep constructor `GeneratorFunction` reference
  var GenFn = router.constructor;

  // setup proto
  router.__proto__ = proto;

  // restore constructor,or koa will raise error
  router.constructor = GenFn;

  // initialize
  router.init();

  return router;
};

/**
 * initialize
 */
proto.init = function() {
  var router = this;
  this.stack = [];

  // build automatic `options` response
  router.use(function* allowedMethods(next) {
    if (this.method === 'OPTIONS') {
      if (!this.allowedMethods) {
        this.allowedMethods = []; // attcch `allowedMethods` on context
      }
    }

    yield * next;

    if (this.method === 'OPTIONS' && this.allowedMethods.length) {
      var allow = this.allowedMethods.join(',');
      this.set('Allow', allow);
      this.body = allow;
    }
  });

  return this;
};

/**
 * dispatch
 *
 * ctx : koa app's request & response context
 */
proto.dispatch = function*(ctx) {
  var router = this;
  var index = 0;

  // setup originalPath
  // take it from `ctx.path` for the first time
  // it's happens once over the request pipe line
  ctx.originalPath = ctx.originalPath || ctx.path;

  // save reference at start of `Router#dispatch`
  var basePath = ctx.basePath || (ctx.basePath = ''); // basePath
  var baseParams = ctx.params || (ctx.params = {}); // params
  var path = ctx.path; // path

  yield * findNext();

  // restore reference at end of `Router#dispatch`
  ctx.basePath = basePath; // basePath
  ctx.params = baseParams; // params
  ctx.path = path; // path

  function* findNext() {
    var layer;

    // no more layer
    if (index === router.stack.length) {
      return;
    }

    while (index < router.stack.length) {
      layer = router.stack[index++];

      if (layer.match(ctx.path)) {

        // a route need to match the `method`
        // not a route
        if (!layer.route) {
          break;
        }

        // method matches
        if (layer.route._handlesMethod(ctx.method)) {
          break;
        }

        // add current method to `ctx.allowedMethods`
        if (ctx.method === 'OPTIONS') {
          layer.route._options().forEach(function(m) {
            if (ctx.allowedMethods.indexOf(m) === -1) {
              ctx.allowedMethods.push(m);
            }
          });
        }
      }

      // if no layer match
      // we just pass the router
      if (index === router.stack.length) {
        return;
      } else {
        continue;
      }
    }

    // keep reference
    var pathBeforeLayer = ctx.path;

    // not a route
    if (!layer.route) {
      ctx.basePath = ctx.basePath + layer.path;
    }

    // trim path
    var ctxPath = ctx.originalPath.substring(ctx.basePath.length);
    if (!ctxPath || !_.startsWith(ctxPath, '/')) {
      ctxPath = '/' + ctxPath + '';
    }
    ctx.path = ctxPath;

    // params
    if (router.options.mergeParams) { // create a new Object
      ctx.params = _.assign({}, ctx.params, layer.params);
    } else {
      ctx.params = layer.params;
    }

    // traverse the layer
    // gen = next(), make sure we pass a generator, not a GeneratorFunction
    // because
    //  - yield* gen : ok
    //  - yield* GenFn: error
    //
    // then restore & find_next
    yield * layer.fn.call(ctx, next(), ctx);

    function* next() {
      // restore
      ctx.path = pathBeforeLayer;
      ctx.basePath = basePath;
      ctx.params = baseParams;

      // find the next
      yield * findNext();
    }
  }
};

/**
 * use a middleware
 */
proto.use = function(path) {
  var fns;
  var fn;

  // path is optional
  if (typeof path === 'string') {
    fns = [].slice.call(arguments, 1);
  } else {
    fns = [].slice.call(arguments);
    path = '/';
  }

  // check
  var msg = 'router.use([path],fn) : fn expected to be GeneratorFunction';
  if (!fns.length) {
    throw new Error(msg);
  }

  // ensure GeneratorFunction
  fns.forEach(function(m) {
    if (!m || typeof m !== 'function' || m.constructor.name !== 'GeneratorFunction') {
      throw new Error(msg);
    }
  });

  // compose
  if (fns.length === 1) {
    fn = fns[0];
  } else {
    fn = compose(fns);
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
  }, route.dispatch.bind(route));

  layer.route = route;
  this.stack.push(layer);

  return route;
};


/**
 * add HTTP verb methods
 */
METHODS.concat('all').forEach(function(m) {
  proto[m] = function(path) {
    var route = this.route(path);
    route[m].apply(route, [].slice.call(arguments, 1));
    return this; // return router
  };
});

proto.del = proto['delete'];