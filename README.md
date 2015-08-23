# impress-router
Express style router for koa

参考 express 4.x 分支代码
https://github.com/strongloop/express/blob/4.x/lib%2Frouter%2Findex.js


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