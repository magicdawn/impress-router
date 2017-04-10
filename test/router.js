'use strict'

const Koa = require('koa')
const request = require('supertest')
const Router = require('../lib/router')
const assert = require('assert')
const METHODS = require('methods')
const should = require('should')

describe('Router', function() {
  let app
  let router
  let server

  beforeEach(function() {
    app = new Koa()
    router = new Router()
    app.use(router)
    server = app.callback()
  })

  it('ok with new', function() {
    let router = new Router();
    (typeof router).should.equal('function')
  })

  it('nested router', async function() {
    const routerA = new Router()
    const routerB = new Router()
    const routerC = new Router()

    router.use('/a', routerA)
    routerA.use('/b', routerB)
    routerB.use('/c', routerC)

    routerC.get('/', function(ctx, next) {
      ctx.body = {
        base: ctx.basePath,
        original: ctx.originalPath,
        path: ctx.path
      }
    })

    const res = await request(server).get('/a/b/c')
    const j = res.body
    // console.log(j)

    j.base.should.equal('/a/b/c')
    j.original.should.equal('/a/b/c')
    j.path.should.equal('/')
  })

  describe('params#', function() {

    it('default `mergeParams` = true', async function() {
      const userRouter = new Router()
      router.use('/user/:uid', userRouter)

      userRouter.get('/:field', function(ctx, next) {
        ctx.body = {
          uid: ctx.params.uid,
          field: ctx.params.field
        }
      })

      const res = await request(server).get('/user/magicdawn/name')
      const j = res.body
      // console.log(j);

      j.uid.should.equal('magicdawn')
      j.field.should.equal('name')
    })

    it('set `mergeParams` to false', async function() {
      const userRouter = new Router({
        mergeParams: false
      })
      router.use('/user/:uid', userRouter)

      userRouter.get('/:field', function(ctx, next) {
        ctx.body = {
          uid: ctx.params.uid,
          field: ctx.params.field
        }
      })

      const res = await request(server).get('/user/magicdawn/name')
      const j = res.body
      j.field.should.equal('name')
      assert.equal(j.uid, undefined)
    })

    it('params with ? & auto index', async function() {
      router.get('/(apple-)?icon-:num(\\d+).png', (ctx, next) => {
        ctx.body = ctx.params
      })
      let res

      res = await request(server).get('/icon-76.png')
      res.body.num.should.equal('76')
      should.not.exists(res.body[0])

      res = await request(server).get('/apple-icon-76.png')
      res.body.num.should.equal('76')
      res.body[0].should.equal('apple-')
    })

    it('params with ?', async function() {
      router.get('/:apple(apple-)?icon-:num(\\d+).png', (ctx, next) => {
        ctx.body = ctx.params
      })
      let res

      res = await request(server).get('/icon-76.png')
      res.body.num.should.equal('76')
      should.not.exists(res.body.apple)

      res = await request(server).get('/apple-icon-76.png')
      res.body.num.should.equal('76')
      res.body.apple.should.equal('apple-')
    })

    it('params with +', async function() {
      router.get('/public/:filename+', (ctx, next) => {
        ctx.body = ctx.params.filename
      })
      let res

      res = await request(server).get('/public/foo')
      res.text.should.equal('foo')

      res = await request(server).get('/public/foo.png')
      res.text.should.equal('foo.png')

      res = await request(server).get('/public/foo/bar')
      res.text.should.equal('foo/bar')

      res = await request(server).get('/public/foo/bar.jpg')
      res.text.should.equal('foo/bar.jpg')
    })
  })


  /**
   * middleware
   */
  describe('middleware', function() {
    it('use a middleware on a /path', async function() {

      router.use('/public', (ctx, next) => {
        ctx.body = {
          originalPath: ctx.originalPath,
          basePath: ctx.basePath,
          path: ctx.path
        }
      })

      const res = await request(server).get('/public/js/foo.js')
      const j = res.body

      // assert
      j.originalPath.should.equal('/public/js/foo.js')
      j.basePath.should.equal('/public')
      j.path.should.equal('/js/foo.js')
    })

    it('fast_slash middleware', async function() {
      router.use((ctx, next) => {
        ctx.body = 'awesome site'
        return next()
      })

      const res = await request(server).get('/')
      res.text.should.match(/awesome/)
    })

    it('throws when miss function', function() {
      assert.throws(function() {
        router.use('/')
      })
    })

    it('use multiple middlewares once', async function() {
      router.use((ctx, next) => {
        ctx.body = 'a'
        return next()
      }, (ctx, next) => {
        ctx.body += 'b'
      })

      const res = await request(server).get('/')
      res.text.should.equal('ab')
    })

    it('use multiple middlewares nested', async function() {
      router.use(
        [
          (ctx, next) => (ctx.body = 'a', next()),
          (ctx, next) => (ctx.body += 'b', next()),
        ],
        ctx => ctx.body += 'c'
      )

      const res = await request(server).get('/')
      res.text.should.equal('abc')
    })
  })

  /**
   * route
   */
  describe('route', function() {

    it('have route handle correctly', async function() {
      const fn = (ctx, next) => {
        ctx.body = ctx.path
      }

      router
        .get('/foo/bar', fn)
        .get('/bar/foo', fn)

      const res = await request(server).get('/foo/bar')
      res.text.should.equal('/foo/bar')
    })

    it('simple params', async function() {
      router.get('/user/:id', (ctx, next) => {
        ctx.body = ctx.params.id
      })

      const res = await request(server).get('/user/magicdawn')
      res.text.should.equal('magicdawn')
    })

    it('`all` method support', async function() {
      router.all('/hello', (ctx) => {
        ctx.body = 'world'
      })

      const res = await request(server).get('/hello')
      res.text.should.equal('world')
    })

    it('automatic OPTIONS response', async function() {
      router
        .get('/foo', ctx => ctx.body = 'foo')
        .post('/foo', ctx => ctx.body = 'bar')

      const res = await request(server).options('/foo')
      res.headers['allow'].should.match(/GET,POST/)
    })

    it('automatic HEAD response', async function() {
      router.get('/foo', (ctx, next) => {
        ctx.body = 'hello world'
      })

      const res = await request(server).head('/foo')
      const len = Buffer.byteLength('hello world').toString()
      const header = res.headers['content-length']
      header.should.equal(len)
    })

    it('throws when miss function', function() {
      assert.throws(function() {
        router.get('/')
      })
    })

    it('use multiple handler once', async function() {
      router.get('/hello', function(ctx, next) {
        ctx.body = 'foo'
        return next()
      }, function(ctx, next) {
        ctx.body += 'bar'
        return next()
      })

      const res = await request(server).get('/hello')
      res.text.should.equal('foobar')
    })

    it('use multiple handler nested', async function() {
      router.get(
        '/hello', [
          (ctx, next) => (ctx.body = 'foo', next()),
          (ctx, next) => (ctx.body += 'bar', next())
        ],
        ctx => ctx.body += 'baz'
      )

      const res = await request(server).get('/hello')
      res.text.should.equal('foobarbaz')
    })

    it('multi route, the first wins', async function() {
      router.get('/hello', (ctx) => {
        ctx.body = 'foo'
      })

      router.get('/hello', (ctx) => {
        ctx.body = 'bar'
      })

      const res = await request(server).get('/hello')
      res.status.should.equal(200)
      res.text.should.equal('foo')
    })
  })
})