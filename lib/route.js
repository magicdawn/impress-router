/**
 * module dependencies
 */
var Methods = require('methods');
var Layer = require('./layer');
var compose = require('koa-compose');

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
  if (this.methods._all) {
    return true;
  }

  method = method.toLowerCase();

  if (method === 'head' && !this.methods['head']) {
    method = 'get';
  }

  return Boolean(this.methods[method]);
};

Route.prototype._options = function() {
  return Object.keys(this.methods).map(function(method) {
    return method.toUpperCase();
  });
};

Route.prototype.all = function() {
  var handler = compose([].slice.call(arguments));

  var layer = new Layer('/', {
    end: true
  }, handler);
  layer.method = undefined;

  this.methods._all = true;
  this.stack.push(layer);

  return this;
};

Methods.forEach(function(method) {
  Route.prototype[method] = function() {
    var handler = compose([].slice.call(arguments));
    var layer = new Layer('/', {}, handler);
    layer.method = method;

    this.methods[method] = true;
    this.stack.push(layer);
    return this;
  };
});

Route.prototype.dispatch = function * (next) {
  var idx = 0;
  var stack = this.stack;
  if (stack.length === 0) {
    yield next;
    return;
  }

  var method = ctx.method.toLowerCase();
  if (method === 'head' && !this.methods['head']) {
    method = 'get';
  }

  yield next();

  function * next() {
    var layer = stack[idx++];
    if (!layer) {
      return;
    }

    if (layer.method && layer.method !== method) {
      yield next;
      return;
    }

    // context ?
    // TODO: 注意ctx
    yield layer.handler.call(ctx, function * () {
      yield next;
    });
  }
};