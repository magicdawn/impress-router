'use strict'

/**
 * module dependencies
 */
const Layer = require('./layer')
const Route = require('./route')
const METHODS = require('methods')
const compose = require('koa-compose')
const debug = require('debug')('impress:router')
const _ = require('lodash')
const co = require('co')

const Router = module.exports = class Router {
  constructor(options) {
    // router definition
    // add an `impressRouter` name
    const router = co.wrap(function* impressRouter(ctx, next) {
      yield router.dispatch(ctx)
      if (router.options.goNext) yield next()
    })

    // router options
    router.options = _.merge({
      goNext: true, // default go next
      strict: false,
      sensitive: false,
      mergeParams: true
    }, options)

    // keep constructor reference
    const Con = router.constructor
    router.__proto__ = this.__proto__
    router.constructor = Con

    // initialize
    router.init()

    return router
  }

  /**
   * initialize
   */
  init() {
    this.stack = []

    // build automatic `options` response
    this.use(co.wrap(function* allowedMethods(ctx, next) {
      if (ctx.method === 'OPTIONS' && !ctx.allowedMethods) {
        ctx.allowedMethods = new Set()
      }

      yield next()

      if (ctx.method.toLowerCase() === 'options' && ctx.allowedMethods.size) {
        const allow = Array.from(ctx.allowedMethods).join(',')
        ctx.set('Allow', allow)
        ctx.body = allow
      }
    }))

    return this
  }

  /**
   * use a middleware
   */
  use(path) {
    let fns
    let fn

    // path is optional
    if (typeof path === 'string') {
      fns = [].slice.call(arguments, 1)
    } else {
      fns = [].slice.call(arguments)
      path = '/'
    }
    fns = _.flattenDeep(fns)

    // ensure function
    if (!fns.length || fns.some(fn => !fn || typeof fn !== 'function')) {
      throw new TypeError('fn expected to be functions')
    }

    // compose
    if (fns.length === 1) fn = fns[0]
    else fn = compose(fns)

    const layer = new Layer(path, {
      end: false,
      strict: this.options.strict,
      sensitive: this.options.sensitive
    }, fn)

    this.stack.push(layer)
    return this
  }

  route(path) {
    const route = new Route(path)

    // `route.dispatch` as `layer.handler` will be called `this = ctx`
    const layer = new Layer(path, {
      strict: this.options.strict,
      sensitive: this.options.sensitive,
      end: true
    }, route.dispatch.bind(route))

    layer.route = route
    this.stack.push(layer)

    return route
  }
}

/**
 * dispatch
 *
 * ctx : koa app's request & response context
 */

Router.prototype.dispatch = co.wrap(function*(ctx) {
  const router = this
  let index = 0

  // setup originalPath
  // take it from `ctx.path` for the first time
  // it's happens once over the request pipe line
  ctx.originalPath = ctx.originalPath || ctx.path

  // save reference at start of `Router#dispatch`
  const basePath = ctx.basePath || (ctx.basePath = '') // basePath
  const baseParams = ctx.params || (ctx.params = {}) // params
  const path = ctx.path // path

  const findNext = co.wrap(function*() {
    // no more layer
    if (index === router.stack.length) return

    let layer
    while (index < router.stack.length) {
      layer = router.stack[index++]

      if (layer.match(ctx.path)) {

        // a route need to match the `method`
        // not a route
        if (!layer.route) break

        // method matches
        if (layer.route._handlesMethod(ctx.method)) break

        // add current method to `ctx.allowedMethods`
        if (ctx.method.toLowerCase() === 'options') {
          const methods = layer.route._options()
          debug('adding options methods: %j', methods)
          methods.forEach(m => ctx.allowedMethods.add(m))
        }
      }

      // if no layer match
      // we just pass the router
      if (index === router.stack.length) return
      else continue
    }

    // keep reference
    const pathBeforeLayer = ctx.path

    // not a route
    if (!layer.route) ctx.basePath = ctx.basePath + layer.path

    // trim path
    let ctxPath = ctx.originalPath.substring(ctx.basePath.length)
    if (!ctxPath || !_.startsWith(ctxPath, '/')) {
      ctxPath = '/' + ctxPath + ''
    }
    ctx.path = ctxPath

    // params
    if (router.options.mergeParams) { // create a new Object
      ctx.params = _.assign({}, ctx.params, layer.params)
    } else {
      ctx.params = layer.params
    }

    // then restore & findNext
    const routerNext = co.wrap(function*() {
      // restore
      ctx.path = pathBeforeLayer
      ctx.basePath = basePath
      ctx.params = baseParams

      // findNext
      yield findNext()
    })

    yield Promise.resolve(layer.fn(ctx, routerNext))
  })

  yield findNext()

  // restore reference at end of `Router#dispatch`
  ctx.basePath = basePath // basePath
  ctx.params = baseParams // params
  ctx.path = path // path
})


/**
 * add HTTP verb methods
 */

METHODS.concat('all').forEach(function(m) {
  Router.prototype[m] = function(path) {
    const route = this.route(path)
    route[m].apply(route, [].slice.call(arguments, 1))
    return this // return router
  }
})

Router.prototype.del = Router.prototype['delete']