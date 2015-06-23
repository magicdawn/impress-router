var app = require('koa')();
var router = require('../')();
app.use(router);

router.use('/public', function * () {
  console.log(this.path);
  console.log(this.originalPath);
});

router.get('/', function * () {
  this.body = 'index page';
});