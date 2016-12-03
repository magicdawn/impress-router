'use strict'

const Koa = require('koa')
const request = require('supertest')
const Router = require('../lib/router')
const assert = require('assert')
const METHODS = require('methods')

describe('Router', function() {
  let app
  let router

  beforeEach(function() {
    app = new Koa()
    router = new Router()
    app.use(router)
  })

  it('ok with new', function() {
    let router = new Router();
    (typeof router).should.equal('function')
  })

  it('nested router', function(done) {
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

    request(app.listen())
      .get('/a/b/c')
      .end(function(err, res) {
        const j = res.body
        // console.log(j);

        j.base.should.equal('/a/b/c')
        j.original.should.equal('/a/b/c')
        j.path.should.equal('/')

        done()
      })
  })

  describe('params#', function() {

    it('default `mergeParams` = true', function(done) {
      const userRouter = new Router()
      router.use('/user/:uid', userRouter)

      userRouter.get('/get_:field', function(ctx, next) {
        ctx.body = {
          uid: ctx.params.uid,
          field: ctx.params.field
        }
      })

      request(app.listen())
        .get('/user/magicdawn/get_name')
        .end(function(err, res) {
          const j = res.body
          // console.log(j);

          j.uid.should.equal('magicdawn')
          j.field.should.equal('name')

          done()
        })
    })

    it('set `mergeParams` to false', function(done) {
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

      request(app.listen())
        .get('/user/magicdawn/name')
        .end(function(err, res) {
          const j = res.body

          j.field.should.equal('name')
          assert.equal(j.uid, undefined)

          done()
        })
    })
  })


  /**
   * middleware
   */
  describe('middleware', function() {
    it('use a middleware on a /path', function(done) {

      router.use('/public', (ctx, next) => {
        ctx.body = {
          originalPath: ctx.originalPath,
          basePath: ctx.basePath,
          path: ctx.path
        }
      })

      request(app.listen())
        .get('/public/js/foo.js')
        .end(function(err, res) {
          // console.log(err);
          const j = res.body

          // assert
          j.originalPath.should.equal('/public/js/foo.js')
          j.basePath.should.equal('/public')
          j.path.should.equal('/js/foo.js')

          done()
        })
    })

    it('fast_slash middleware', function(done) {
      router.use((ctx, next) => {
        ctx.body = 'awesome site'
        return next()
      })

      request(app.listen())
        .get('/')
        .end(function(err, res) {
          res.text.should.match(/awesome/)
          done()
        })
    })

    it('throws when miss function', function() {
      assert.throws(function() {
        router.use('/')
      })
    })

    it('use multiple middlewares once', function(done) {
      router.use((ctx, next) => {
        ctx.body = 'a'
        return next()
      }, (ctx, next) => {
        ctx.body += 'b'
      })

      request(app.listen())
        .get('/')
        .end(function(err, res) {
          res.text.should.equal('ab')
          done()
        })
    })

    it('use multiple middlewares nested', function(done) {
      router.use(
        [
          (ctx, next) => (ctx.body = 'a', next()),
          (ctx, next) => (ctx.body += 'b', next()),
        ],
        ctx => ctx.body += 'c'
      )

      request(app.listen())
        .get('/')
        .end(function(err, res) {
          res.text.should.equal('abc')
          done()
        })
    })
  })

  /**
   * route
   */
  describe('route', function() {

    it('have route handle correctly', function(done) {
      const fn = (ctx, next) => {
        ctx.body = ctx.path
      }

      router
        .get('/foo/bar', fn)
        .get('/bar/foo', fn)

      request(app.listen())
        .get('/foo/bar')
        .end(function(err, res) {
          res.text.should.equal('/foo/bar')
          done()
        })
    })

    it('simple params', function(done) {
      router.get('/user/:id', (ctx, next) => {
        ctx.body = ctx.params.id
      })

      request(app.listen())
        .get('/user/magicdawn')
        .end(function(err, res) {
          res.text.should.equal('magicdawn')
          done()
        })
    })

    it('`all` method support', function(done) {
      router.all('/hello', (ctx) => {
        ctx.body = 'world'
      })

      app = app.callback()
      request(app)
        .get('/hello')
        .end(function(err, res) {
          res.text.should.equal('world')
          done()
        })
    })

    it('automatic OPTIONS response', function(done) {
      router
        .get('/foo', ctx => ctx.body = 'foo')
        .post('/foo', ctx => ctx.body = 'bar')

      request(app.listen())
        .options('/foo')
        .end(function(err, res) {
          res.headers['allow'].should.match(/GET,POST/)
          done()
        })
    })

    it('automatic HEAD response', function(done) {
      router.get('/foo', (ctx, next) => {
        ctx.body = 'hello world'
      })

      request(app.listen())
        .head('/foo')
        .end(function(err, res) {

          const len = Buffer.byteLength('hello world').toString()
          const header = res.headers['content-length']
          header.should.equal(len)

          done()
        })
    })

    it('throws when miss function', function() {
      assert.throws(function() {
        router.get('/')
      })
    })

    it('use multiple handler once', function(done) {
      router.get('/hello', function(ctx, next) {
        ctx.body = 'foo'
        return next()
      }, function(ctx, next) {
        ctx.body += 'bar'
        return next()
      })

      request(app.listen())
        .get('/hello')
        .end(function(err, res) {
          res.text.should.equal('foobar')
          done(err)
        })
    })

    it('use multiple handler nested', function(done) {
      router.get(
        '/hello', [
          (ctx, next) => (ctx.body = 'foo', next()),
          (ctx, next) => (ctx.body += 'bar', next())
        ],
        ctx => ctx.body += 'baz'
      )

      request(app.listen())
        .get('/hello')
        .end(function(err, res) {
          res.text.should.equal('foobarbaz')
          done(err)
        })
    })

    it('multi route, the first wins', function(done) {
      router.get('/hello', (ctx) => {
        ctx.body = 'foo'
      })

      router.get('/hello', (ctx) => {
        ctx.body = 'bar'
      })

      request(app.listen())
        .get('/hello')
        .expect(200, 'foo', done)
    })
  })
})