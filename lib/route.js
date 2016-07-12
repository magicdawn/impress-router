'use strict';

/**
 * module dependencies
 */
const METHODS = require('methods');
const compose = require('koa-compose');
const debug = require('debug')('impress:route');
const co = require('co');

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
Route.prototype._handlesMethod = function(method) {
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
  const methods = this.methods.all ? METHODS : Object.keys(this.methods);
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
    const fns = [].slice.call(arguments);
    let fn;

    // ensure function
    if (!fns.length || fns.some(fn => !fn || typeof fn !== 'function')) {
      throw new TypeError('fn expected to be functions');
    }

    // compose
    if (fns.length === 1) {
      fn = fns[0];
    } else {
      fn = compose(fns);
    }

    // simple stack item with `method` & fn
    const layer = {
      method: method,
      fn: fn
    };

    this.methods[method] = true;
    this.stack.push(layer);
    return this;
  };
});

/**
 * dispatch request on route
 *
 * @param {generatoe} next
 * @param {Object} ctx
 */
Route.prototype.dispatch = co.wrap(function*(ctx, next) {
  const route = this;
  debug('dispatch on route : %s', ctx.path);

  const stack = route.stack;
  let idx = 0;
  let layer;

  let method = ctx.method.toLowerCase();
  if (method === 'head' && !route.methods['head']) {
    method = 'get';
  }

  const findNext = co.wrap(function*() {
    if (idx === stack.length) {
      yield next(); // end of route, find next route
      return;
    }

    while (idx < stack.length) {
      layer = stack[idx++];

      // we find a match
      if (layer && (route.methods.all || layer.method === method)) {
        break;
      } else { // not match

        // end Route
        if (idx === stack.length) {
          yield next(); // end of route, find next route
          return;
        } else {
          continue;
        }
      }
    }

    // call the layer, make sure layer.fn(next) next as a generator
    // then find_next
    yield Promise.resolve(layer.fn(ctx, findNext));
  });

  yield findNext();
});