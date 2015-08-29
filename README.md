# impress-router
Express style router for koa

[![Build Status](https://travis-ci.org/magicdawn/impress-router.svg)](https://travis-ci.org/magicdawn/impress-router)
[![Coverage Status](https://coveralls.io/repos/magicdawn/impress-router/badge.svg?branch=master&service=github)](https://coveralls.io/github/magicdawn/impress-router?branch=master)
[![npm version](https://img.shields.io/npm/v/impress-router.svg)](https://www.npmjs.com/package/impress-router)
[![npm downloads](https://img.shields.io/npm/dm/impress-router.svg)](https://www.npmjs.com/package/impress-router)


## Install
```sh
npm i impress-router --save
```

## API

### basic

```js
var Router = require('impress-router');
var router = Router();
app.use(router);
```

`new Router(options)`, or with out new `Router(options)`

Options

- goNext: default true, whether go down stream
- strict,sensitive: these are [path-to-regexp](https://github.com/pillarjs/path-to-regexp) options
- mergeParams: default true, whether merge params when nested router


### middleware

use middleware on some path, and you got `ctx.path` `ctx.basePath` `ctx.originalPath`
just as Express's `req.baseUrl` / `req.originalUrl` does:

```js
var app = require('koa')();
var router = require('impress-router')();
app.use(router);

router.use('/public',function (next){
  
  // when requesting `/public/js/foo.js`
  this.path; // `/js/foo.js`
  this.basePath; // `/public`
  this.originalPath; // `/public/js/foo.js`

  yield next;
});

```

Em, use on all request:

```js
var app = require('koa')();
var router = require('impress-router')();
app.use(router);

router.use(function * (next){
  this.user = { name: 'foo', age: 18 };
  yield* next;
})
```

### route

#### Features

- `GET POST ...` methods exposed by `methods` module are supported
- all supported, `router.all(path,fn)`
- auto `OPTIONS` response
- auto `HEAD` response


```js
var app = require('koa')();
var router = require('impress-router')();
app.use(router);

router.get('/hello',function * (){
  this.body = 'hello';
});

router.all('/hello',function * (){
  this.body = 'hello';
});
```

#### params

```js
var app = require('koa')();
var Router = require('impress-router');
var router = Router();
app.use(router);

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

## Why
koa-router is not handy as expected, so ...

## License
MIT &copy; 2015 Magicdawn http://magicdawn.mit-license.org