const Layer = require('./layer')
const Route = require('./route')
const METHODS = require('methods')
const compose = require('koa-compose')
const debug = require('debug')('impress:router')
const _ = require('lodash')

const Router = (module.exports = class Router {
  constructor(opts) {
    // router definition
    // add an `impressRouter` name
    const router = function impressRouter(ctx, next) {
      return router.dispatch(ctx, next)
    }

    // router opts
    opts = opts || {}
    router.opts = _.defaults(opts, {
      strict: false,
      sensitive: false,
      mergeParams: true,
      useThis: true,
    })

    // keep constructor reference
    const Con = router.constructor
    router.__proto__ = this.__proto__
    router.constructor = Con

    // initialize
    router.init()

    return router
  }

  init() {
    this.stack = []

    // build automatic `opts` response
    this.use(async function allowedMethods(ctx, next) {
      // not options request
      if (ctx.method.toLowerCase() !== 'options') return next()

      // build Allow
      ctx.allowedMethods = new Set()

      await next()

      const allow = Array.from(ctx.allowedMethods).join(',')
      ctx.set('Allow', allow)
      ctx.body = allow
    })

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

    const layer = new Layer(
      path,
      {
        end: false,
        strict: this.opts.strict,
        sensitive: this.opts.sensitive,
      },
      fn
    )

    this.stack.push(layer)
    return this
  }

  route(path) {
    const route = new Route(path)

    // `route.dispatch` as `layer.handler` will be called `this = ctx`
    const layer = new Layer(
      path,
      {
        strict: this.opts.strict,
        sensitive: this.opts.sensitive,
        end: true,
      },
      route.dispatch.bind(route)
    )

    layer.route = route
    this.stack.push(layer)

    return route
  }

  /**
   * dispatch
   *
   * ctx : koa app's request & response context
   */

  async dispatch(ctx, next) {
    const router = this
    let index = 0

    // useThis
    if (
      !ctx[Symbol.for('impress-router:opts:use-this')] &&
      router.opts.useThis
    ) {
      ctx[Symbol.for('impress-router:opts:use-this')] = router.opts.useThis
    }

    // setup originalPath
    // take it from `ctx.path` for the first time
    // it's happens once over the request pipe line
    ctx.originalPath = ctx.originalPath || ctx.path

    // save reference at start of `Router#dispatch`
    const basePath = ctx.basePath || (ctx.basePath = '') // basePath
    const baseParams = ctx.params || (ctx.params = {}) // params
    const path = ctx.path // path

    // restore
    const restore = () => {
      ctx.basePath = basePath // basePath
      ctx.params = baseParams // params
      ctx.path = path // path
    }

    // app level next
    const nextWrapper = () => {
      restore()
      return next()
    }

    const findNext = async function() {
      // no more layer
      if (index === router.stack.length) return nextWrapper()

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
        if (index === router.stack.length) return await nextWrapper()
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
      if (router.opts.mergeParams) {
        // create a new Object
        ctx.params = Object.assign({}, ctx.params, layer.params)
      } else {
        ctx.params = layer.params
      }

      // then restore & findNext
      const routerNext = async function() {
        // restore
        ctx.path = pathBeforeLayer
        ctx.basePath = basePath
        ctx.params = baseParams

        // findNext
        await findNext()
      }

      // if `layer.fn` is a Router, `layer.fn.call` is undefine
      if (ctx[Symbol.for('impress-router:opts:use-this')] && layer.fn.call) {
        await Promise.resolve(layer.fn.call(ctx, ctx, routerNext))
      } else {
        await Promise.resolve(layer.fn(ctx, routerNext))
      }
    }

    await findNext()
    restore()
  }

  /**
   * augment Koa App
   * app: Koa
   */
  augmentApp(app) {
    const router = this

    // attach app
    app.use(router)
    app.router = router

    // app.<method>
    const ms = METHODS.concat(['all', 'del', 'use'])
    for (let m of ms) {
      app[m] = router[m].bind(router)
    }
  }
})

/**
 * add HTTP verb methods
 */

METHODS.concat(['all']).forEach(function(m) {
  Router.prototype[m] = function(path) {
    const route = this.route(path)
    route[m].apply(route, [].slice.call(arguments, 1))
    return this // return router
  }
})

Router.prototype.del = Router.prototype['delete']
