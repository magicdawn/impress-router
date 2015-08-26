var app = module.exports = require('koa')();
var Router = require('../lib/router');
var router = Router();
var request = require('supertest');
app.use(router);

/**
 * 在某一path上use middleware
 */
router.use('/public', function * () {
  this.body = {
    originalPath: this.originalPath,
    basePath: this.basePath,
    path: this.path,
  };
});

/**
 * simple route
 */
router.get('/hello', function * () {
  this.body = 'world';
});

/**
 * nested router test
 */
var fn = function * (next) {
  console.log('basePath: %s, path: %s', this.basePath, this.path);
  yield next;
};

var router_a = Router();
var router_b = Router();
var router_c = Router();

router.use('/a', fn, router_a);
router_a.use('/b', fn, router_b);
router_b.use('/c', fn, router_c);

router_c.get('/', function * () {
  console.log('calling ');
  this.body = {
    path: this.path,
    basePath: this.basePath,
    originalPath: this.originalPath
  }
});

/**
 * param
 */
router.get('/user/:id/detail', function * (next) {
  this.body = {
    id: this.params.id
  }
});