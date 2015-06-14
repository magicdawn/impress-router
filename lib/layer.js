module.exports = Layer;

function Layer(path) {
  this.path = path;
}

/**
 * proto
 */
var layer = Layer.prototype;

/**
 *
 */
layer.dispatch = function * () {
};