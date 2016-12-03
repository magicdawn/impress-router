'use strict'
const app = module.exports = new(require('koa'))()
const Router = require('../')
const co = require('co')
const router = new Router()
const request = require('supertest')
app.use(router)

/**
 * 在某一path上use middleware
 */
router.use('/public', function(ctx, next) {
  ctx.body = {
    originalPath: ctx.originalPath,
    basePath: ctx.basePath,
    path: ctx.path
  }
})

/**
 * simple route
 */
router.get('/hello', function(ctx, next) {
  ctx.body = 'world'
})

/**
 * nested router test
 */
const fn = co.wrap(function*(ctx, next) {
  console.log('basePath: %s, path: %s', ctx.basePath, ctx.path)
  yield next()
})

const routerA = new Router()
const routerB = new Router()
const routerC = new Router()

router.use('/a', fn, routerA)
routerA.use('/b', fn, routerB)
routerB.use('/c', fn, routerC)
routerC.get('/', function(ctx, next) {
  console.log('calling ')
  ctx.body = {
    path: ctx.path,
    basePath: ctx.basePath,
    originalPath: ctx.originalPath
  }
})

/**
 * param
 */
router.get('/user/:id/detail', function(ctx, next) {
  ctx.body = {
    id: ctx.params.id
  }
})

/**
 * nested param
 */
const routerUser = new Router({
  mergeParams: true
})
router.use('/user/:id', routerUser)
routerUser.get('/:field', function(ctx, next) {
  ctx.body = {
    id: ctx.params.id,
    field: ctx.params.field
  }
})