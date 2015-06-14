# impress-router
Express style router for koa

## Install
```sh
npm i impress-router --save
```

## API

```js
var Router = require('impress-router');
var router = Router;
app.use(router);

// use middleware
router.use('/public',require('koa-static')());

// GET POST blabla
router.get('/hello',function *(){
  this.body = 'hello';
});
```

## License
MIT http://magicdawn.mit-license.org