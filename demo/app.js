'use strict';
const app = module.exports = require('koa')();
const Router = require('../lib/router');
const router = Router();
const request = require('supertest');
app.use(router);

/**
 * 在某一path上use middleware
 */
router.use('/public', function*() {
  this.body = {
    originalPath: this.originalPath,
    basePath: this.basePath,
    path: this.path
  };
});

/**
 * simple route
 */
router.get('/hello', function*() {
  this.body = 'world';
});

/**
 * nested router test
 */
const fn = function*(next) {
  console.log('basePath: %s, path: %s', this.basePath, this.path);
  yield next;
};

const routerA = Router();
const routerB = Router();
const routerC = Router();

router.use('/a', fn, routerA);
routerA.use('/b', fn, routerB);
routerB.use('/c', fn, routerC);
routerC.get('/', function*() {
  console.log('calling ');
  this.body = {
    path: this.path,
    basePath: this.basePath,
    originalPath: this.originalPath
  };
});

/**
 * param
 */
router.get('/user/:id/detail', function*(next) {
  this.body = {
    id: this.params.id
  };
});

/**
 * nested param
 */
const routerUser = Router({
  mergeParams: true
});
router.use('/user/:id', routerUser);
routerUser.get('/detail/:field', function*() {
  this.body = {
    id: this.params.id,
    field: this.params.field
  };
});