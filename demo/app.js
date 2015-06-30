var app = require('koa')();
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

var fn = function * (next) {
  console.log(this.path);
  console.log(this.basePath);
  yield next;
};

var router_a = Router();
var router_b = Router();
var router_c = Router();

router.use('/a',fn,router_a);
router_a.use('/b',fn,router_b);
router_b.use('/c',fn,router_c);

router_c.get('/',function(){

});

request(app.listen())
  .get('/public/js/app.js')
  .end();


// /**
//  * 在某一path上use router
//  */
// var user_router = Router();
// user_router.get('/detail', function * () {
//   // get /user/detail
//   this.path = '/detail'
// });
// router.use('/user', user_router);

// *
//  * 直接use middleware

// router.use(function * () {
//   // get /abcd/efg
//   this.path = '/abcd/efg'
// });

// /**
//  * do route
//  */
// router.get('/', function * () {
//   this.body = 'index page';
// });