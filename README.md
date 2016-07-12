# impress-router
port Express router to koa

[![Build Status](https://img.shields.io/travis/magicdawn/express-modern.svg?style=flat-square)](https://travis-ci.org/magicdawn/impress-router)
[![Coverage Status](https://img.shields.io/coveralls/magicdawn/impress-router.svg?style=flat-square)](https://coveralls.io/github/magicdawn/impress-router?branch=master)
[![node version](https://img.shields.io/node/v/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm version](https://img.shields.io/npm/v/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm downloads](https://img.shields.io/npm/dm/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm license](https://img.shields.io/npm/l/impress-router.svg?style=flat-square)](http://magicdawn.mit-license.org)

## Install
```sh
# koa@2
npm i impress-router@next --save

# for koa@1 support, see koa-v1 branch
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
var app = new (require('koa'))();
var router = require('impress-router')();
app.use(router);

router.use('/public', (ctx, next){

  // when requesting `/public/js/foo.js`
  ctx.path; // `/js/foo.js`
  ctx.basePath; // `/public`
  ctx.originalPath; // `/public/js/foo.js`

  return next();
});

```

Em, use on all request:

```js
var app = new (require('koa'))();
var router = require('impress-router')();
app.use(router);

router.use((ctx, next) => {
  ctx.user = { name: 'foo', age: 18 };
  return next();
})
```

### route

#### Features

- `GET POST ...` methods exposed by `methods` module are supported
- `all` supported, `router.all(path,fn)`
- auto `OPTIONS` response
- auto `HEAD` response


```js
var app = new (require('koa'))();
var router = require('impress-router')();
app.use(router);

router.get('/hello', ctx => {
  ctx.body = 'hello';
});

router.all('/hello', ctx => {
  ctx.body = 'hello';
});
```

#### params

```js
var app = new (require('koa'))();
var Router = require('impress-router');
var router = Router();
app.use(router);

var userRouter = Router();
router.use('/user/:uid', userRouter);

userRouter.get('/:field', ctx => {
  ctx.body = {
    uid: this.params.uid,
    field: this.params.field
  };
});

// GET /user/magicdawn/name
// =>
// { uid: 'magicdawn', field: 'name' }
```

## Why
`require('express').Router` is very nice, so port it to koa

## License
the MIT License http://magicdawn.mit-license.org