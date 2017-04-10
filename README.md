# impress-router

port express router to koa

[![Build Status](https://img.shields.io/travis/magicdawn/express-modern.svg?style=flat-square)](https://travis-ci.org/magicdawn/impress-router)
[![Coverage Status](https://img.shields.io/codecov/c/github/magicdawn/impress-router.svg?style=flat-square)](https://codecov.io/gh/magicdawn/impress-router)
[![node version](https://img.shields.io/node/v/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm version](https://img.shields.io/npm/v/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm downloads](https://img.shields.io/npm/dm/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm license](https://img.shields.io/npm/l/impress-router.svg?style=flat-square)](http://magicdawn.mit-license.org)
[![Greenkeeper badge](https://badges.greenkeeper.io/magicdawn/impress-router.svg)](https://greenkeeper.io/)

## Install

```sh
# koa@2
npm i impress-router --save

# koa@1, see koa-v1 branch
npm i impress-router@0 --save
```

## API

### basic

```js
const Router = require('impress-router');
const router = new Router();
app.use(router);
```

`new Router(options)`

Options

- `strict` & `sensitive` : these are [path-to-regexp](https://github.com/pillarjs/path-to-regexp) options
  - `strict`: default false, when false the trailing `/` is optional
  - `sensitive`: default false, case sensitive
- `mergeParams` : default true, whether merge params when nested router
- `useThis`: use `this` = `ctx`, like koa v1. defaults to true


### middleware

use middleware on some path, and you got `ctx.path` `ctx.basePath` `ctx.originalPath`
just as Express's `req.baseUrl` / `req.originalUrl` does:

```js
const app = new (require('koa'))();
const router = new (require('impress-router'))();
app.use(router);

router.use('/public', (ctx, next){

  // when requesting `/public/js/foo.js`
  ctx.path; // `/js/foo.js`
  ctx.basePath; // `/public`
  ctx.originalPath; // `/public/js/foo.js`

  return next();
});

```

use middleware on all requests:

```js
const app = new (require('koa'))();
const router = new require('impress-router')();
app.use(router);

router.use((ctx, next) => {
  ctx.user = { name: 'foo', age: 18 };
  return next();
})
```

### route

#### Features

- `GET POST ...` methods exposed by `methods` module are supported
- `all` method supported, via `router.all(path,fn)`
- `OPTIONS` method supported, automatic build the `Allow` response


```js
const app = new (require('koa'))();
const router = new (require('impress-router'))();
app.use(router);

router.get('/hello', ctx => {
  ctx.body = 'world';
});

router.all('/foo', ctx => {
  ctx.body = 'bar';
});
```

#### params

```js
const app = new (require('koa'))();
const Router = require('impress-router');
const router = new Router();
app.use(router);

const userRouter = new Router();
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
`require('express').Router` is very nice, so I'm porting it to koa

## License
the MIT License http://magicdawn.mit-license.org