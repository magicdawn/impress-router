# impress-router
> express style router for koa v2

[![Build Status](https://img.shields.io/travis/magicdawn/express-modern.svg?style=flat-square)](https://travis-ci.org/magicdawn/impress-router)
[![Coverage Status](https://img.shields.io/codecov/c/github/magicdawn/impress-router.svg?style=flat-square)](https://codecov.io/gh/magicdawn/impress-router)
[![node version](https://img.shields.io/node/v/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm version](https://img.shields.io/npm/v/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm downloads](https://img.shields.io/npm/dm/impress-router.svg?style=flat-square)](https://www.npmjs.com/package/impress-router)
[![npm license](https://img.shields.io/npm/l/impress-router.svg?style=flat-square)](http://magicdawn.mit-license.org)
[![Greenkeeper badge](https://badges.greenkeeper.io/magicdawn/impress-router.svg)](https://greenkeeper.io/)

## Install

```sh
$ npm i impress-router -S
```

## API

### basic

```js
const Router = require('impress-router')
const router = new Router()
app.use(router)
```

`new Router(options)` Options

|key|type|default|description|
|---|----|-------|-----------|
|`strict`| `Boolean` | `false` | when `false` the trailing `/` is optional`, see [path-to-regexp](https://github.com/pillarjs/path-to-regexp) doc |
|`sensitive`| `Boolean` | `false` | when `false`, case is not `sensitive`, see [path-to-regexp](https://github.com/pillarjs/path-to-regexp) doc |
|`mergeParams`| `Boolean` | `true` | when `true`, merge params when we have nested routers |
|`useThis`| `Boolean` | `true` | when `true`, the handler `this` equal to `ctx` |


### `router.use([path], middleware)`

middleware can be mount on path, or on the root path `/`

- `ctx.basePath` the mount path
- `ctx.path` the path with `basePath` trimed
- `ctx.originalPath` the untrimed path

It's kind like Express `req.baseUrl` / `req.originalUrl` does

```js
const app = new (require('koa'))()
const router = new (require('impress-router'))()
app.use(router)

router.use('/public', (ctx, next) {
  // when requesting `/public/js/foo.js`
  ctx.path // `/js/foo.js`
  ctx.basePath // `/public`
  ctx.originalPath // `/public/js/foo.js`
  return next()
})

```

### `app.<method>(path, handler)`

- `get` / `post` / `...` methods exposed by `methods` module are supported
- `all` method supported, via `router.all(path,fn)`
- `OPTIONS` method supported, automatic build the `Allow` response

```js
const app = new (require('koa'))()
const router = new (require('impress-router'))()
app.use(router)

router.get('/hello', ctx => {
  ctx.body = 'world'
})

router.all('/foo', ctx => {
  ctx.body = 'bar'
})
```

#### params

```js
const app = new (require('koa'))()
const Router = require('impress-router')
const router = new Router()
app.use(router)

const userRouter = new Router()
router.use('/user/:uid', userRouter)

userRouter.get('/:field', ctx => {
  ctx.body = {
    uid: this.params.uid,
    field: this.params.field
  }
})

// GET /user/magicdawn/name
// =>
// { uid: 'magicdawn', field: 'name' }
```

## Why
- express.Router is very nice
- koa-router package is not very friendly, especially on middleware mount on path
- so I'm porting it to koa

## License
the MIT License http://magicdawn.mit-license.org