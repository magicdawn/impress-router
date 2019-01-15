# Changelog

## v1.6.0 2019-01-15

- add `router#augmentApp` for better experience

## v1.5.0 2017-04-10

- add `useThis` option, use `this` instead of `ctx` like koa v1

## v1.4.1 2017-02-26

- drop support to node < 7.6.0
- use `async/await` instead of `co`, in lib & test
- rm `next` publish tag

## v1.4.0 2017-01-26

- rm `goNext` option, and wrap the koa app level next in a router inner `next`,
  inspired by koa-static `done` field to decide whether to call `next()`

## v1.3.0 2017-01-09

- upgrade to path-to-regexp@1.7.0
- add `+`/`?` params test

## v1.2.1 2016-12-03

- update `.eslintrc.yml` & fix code style

## v1.2.0 2016-12-03

- add `_.flattenDeep` to `router.use` & `router.get` etc
- get 100% code coverage
- use codecov instead of coveralls
- update deps & dev-deps

## v1.1.0 2016-07-16

- use es6 class, all exports must invoked with `new`

## v1.0.0 2016-07-12

- add koa@2 support, use `koa-v1` track koa@1

## v0.2.5 2016-05-20

- fix path-to-regexp trouble, see <https://github.com/pillarjs/path-to-regexp/issues/81>

## v0.2.4 Unknown Date

- it works well
