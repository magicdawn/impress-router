# impress-router
Express style router for koa


## Install
```sh
npm i impress-router --save
```

## API

```js
var Router = require('impress-router');
var router = Router();
app.use(router);

// use middleware
router.use('/public',function (next){
  
  // when requesting `/public/js/foo.js`
  this.path; // `/js/foo.js`
  this.basePath; // `/public`
  this.originalPath; // `/public/js/foo.js`

  yield next;
});

// use middleware on all path
router.use(function * (next){
  this.body = 'hello';
  yield next;
})

// GET POST blabla
router.get('/hello',function * (){
  this.body = 'hello';
});

// params
var userRouter = Router();
router.use('/user/:uid', userRouter);

userRouter.get('/get_:field', function * () {
  this.body = {
    uid: this.params.uid,
    field: this.params.field
  }
});
// GET /user/magicdawn/get_name 
// =>
// { uid: 'magicdawn', field: 'name' }
```

## License
MIT http://magicdawn.mit-license.org