/**
 * module dependencies
 */
var METHODS = require('methods');
var compose = require('koa-compose');
var debug = require('debug')('impress:route');

/**
 * exports
 */
module.exports = Route;

/**
 * Route class
 */
function Route(path) {
  if (!(this instanceof Route)) {
    return new Route(path);
  }

  this.path = path;
  this.stack = [];
  this.methods = {};
}

/**
 * check handle method ?
 */
Route.prototype._handles_method = function(method) {
  if (this.methods.all) {
    return true;
  }

  method = method.toLowerCase();
  if (method === 'head' && !this.methods['head']) {
    method = 'get';
  }

  return Boolean(this.methods[method]);
};

/**
 * return allowed methods
 */
Route.prototype._options = function() {
  var methods = this.methods.all ? METHODS : Object.keys(this.methods);
  return methods.map(function(method) {
    return method.toUpperCase();
  });
};

/**
 * add HTTP verb method
 * include `all`
 *
 */
METHODS.concat('all').forEach(function(method) {
  Route.prototype[method] = function() {
    var fns = [].slice.call(arguments);
    var fn;

    // check
    if (!fns.length) {
      return;
    }

    // ensure GeneratorFunction
    fns.forEach(function(fn) {
      if (!fn || typeof fn !== 'function' || fn.constructor.name !== 'GeneratorFunction') {
        throw new Error('route.' + method + ' requires generator function');
      }
    });

    // compose
    if (fns.length === 1) {
      fn = fns[0]
    } else {
      fn = compose(fns);
    }

    // simple stack item with `method` & fn
    var layer = {
      method: method,
      fn: fn
    };

    this.methods[method] = true;
    this.stack.push(layer);
    return this;
  };
});

// 
Route.prototype.dispatch = function * (next, ctx) {
  var route = this; // new Layer时 route.dispatch.bind
  debug('this : %j', this);

  var idx = 0;
  var layer;
  var stack = route.stack;
  if (stack.length === 0) {
    yield next;
    return;
  }

  var method = ctx.method.toLowerCase();
  if (method === 'head' && !route.methods['head']) {
    method = 'get';
  }

  yield find_next();
  yield next; // 如果一个 route 没有调用 next, 后续route不会受影响

  function * find_next() {
    if (idx === stack.length) {
      return;
    }

    while (idx < stack.length) {
      layer = stack[idx++];

      // we find a match
      if (layer && (layer.method.all || layer.method === method)) {
        break;
      } else { // not match

        // end Route
        if (idx === stack.length) {
          return;
        } else {
          continue;
        }
      }
    }

    // call the layer
    // then find_next
    yield layer.fn.call(ctx, find_next, ctx);
  }
};