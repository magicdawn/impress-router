'use strict';

const koa = require('koa');
const request = require('supertest');
const Router = require('../lib/router');
const assert = require('assert');
const METHODS = require('methods');

describe('Router', function() {
  let app;
  let router;

  beforeEach(function() {
    app = koa();
    router = Router();
    app.use(router);
  });

  it('ok with/without new', function() {
    let router = new Router();
    (typeof router).should.equal('function');
    router.constructor.name.should.equal('GeneratorFunction');

    router = Router();
    (typeof router).should.equal('function');
    router.constructor.name.should.equal('GeneratorFunction');
  });

  it('nested router', function(done) {
    const routerA = Router();
    const routerB = Router();
    const routerC = Router();

    router.use('/a', routerA);
    routerA.use('/b', routerB);
    routerB.use('/c', routerC);

    routerC.get('/', function*() {
      this.body = {
        base: this.basePath,
        original: this.originalPath,
        path: this.path
      };
    });

    request(app.listen())
      .get('/a/b/c')
      .end(function(err, res) {
        const j = res.body;
        // console.log(j);

        j.base.should.equal('/a/b/c');
        j.original.should.equal('/a/b/c');
        j.path.should.equal('/');

        done();
      });
  });

  describe('params#', function() {

    it('default `mergeParams` = true', function(done) {
      const userRouter = Router();
      router.use('/user/:uid', userRouter);

      userRouter.get('/get_:field', function*() {
        this.body = {
          uid: this.params.uid,
          field: this.params.field
        };
      });

      request(app.listen())
        .get('/user/magicdawn/get_name')
        .end(function(err, res) {
          const j = res.body;
          // console.log(j);

          j.uid.should.equal('magicdawn');
          j.field.should.equal('name');

          done();
        });
    });

    it('set `mergeParams` to false', function(done) {
      const userRouter = Router({
        mergeParams: false
      });
      router.use('/user/:uid', userRouter);

      userRouter.get('/get_:field', function*() {
        this.body = {
          uid: this.params.uid,
          field: this.params.field
        };
      });

      request(app.listen())
        .get('/user/magicdawn/get_name')
        .end(function(err, res) {
          const j = res.body;

          j.field.should.equal('name');
          assert.equal(j.uid, undefined);

          done();
        });
    });
  });


  /**
   * middleware
   */
  describe('middleware', function() {
    it('use a middleware on a /path', function(done) {

      router.use('/public', function*() {
        this.body = {
          originalPath: this.originalPath,
          basePath: this.basePath,
          path: this.path
        };
      });

      request(app.listen())
        .get('/public/js/foo.js')
        .end(function(err, res) {
          // console.log(err);
          const j = res.body;

          // assert
          j.originalPath.should.equal('/public/js/foo.js');
          j.basePath.should.equal('/public');
          j.path.should.equal('/js/foo.js');

          done();
        });
    });

    it('fast_slash middleware', function(done) {
      router.use(function*() {
        this.body = 'awesome site';
      });

      request(app.listen())
        .get('/')
        .end(function(err, res) {
          res.text.should.match(/awesome/);
          done();
        });
    });

    it('throws when not using GeneratorFunction', function() {
      assert.throws(function() {
        router.use(function() {});
      });
    });

    it('throws when miss function', function() {
      assert.throws(function() {
        router.use('/');
      });
    });

    it('use multiple middlewares once', function(done) {
      router.use(function*(next) {
        this.body = 'a';
        yield next;
      }, function*() {
        this.body += 'b';
      });

      request(app.listen())
        .get('/')
        .end(function(err, res) {
          res.text.should.equal('ab');
          done();
        });
    });
  });

  /**
   * route
   */
  describe('route', function() {

    it('have route handle correctly', function(done) {
      const fn = function*() {
        this.body = this.path;
      };

      router
        .get('/foo/bar', fn)
        .get('/bar/foo', fn);

      request(app.listen())
        .get('/foo/bar')
        .end(function(err, res) {
          res.text.should.equal('/foo/bar');
          done();
        });
    });

    it('simple params', function(done) {
      router.get('/user/:id', function*() {
        this.body = this.params.id;
      });

      request(app.listen())
        .get('/user/magicdawn')
        .end(function(err, res) {
          res.text.should.equal('magicdawn');
          done();
        });
    });

    it('`all` method support', function(done) {
      router.all('/hello', function*() {
        this.body = 'world';
      });

      app = app.callback();
      request(app)
        .get('/hello')
        .end(function(err, res) {
          res.text.should.equal('world');
          done();
        });
    });

    it('automatic OPTIONS response', function(done) {
      router.get('/foo', function*() {
        this.body = 'foo';
      });

      router.post('/foo', function*() {
        this.body = 'bar';
      });

      request(app.listen())
        .options('/foo')
        .end(function(err, res) {

          res.headers['allow'].should.match(/GET,POST/);
          done();
        });
    });

    it('automatic HEAD response', function(done) {
      router.get('/foo', function*() {
        this.body = 'hello world';
      });

      request(app.listen())
        .head('/foo')
        .end(function(err, res) {

          const len = Buffer.byteLength('hello world').toString();
          const header = res.headers['content-length'];
          header.should.equal(len);

          done();
        });
    });

    it('throws when not using GeneratorFunction', function() {
      assert.throws(function() {
        router.get('/', function() {});
      });
    });

    it('throws when miss function', function() {
      assert.throws(function() {
        router.get('/');
      });
    });

    it('use multiple handler once', function(done) {
      router.get('/hello', function*(next) {
        this.body = 'foo';
        yield next;
      }, function*() {
        this.body += 'bar';
      });

      request(app.listen())
        .get('/hello')
        .end(function(err, res) {
          res.text.should.equal('foobar');
          done(err);
        });
    });

    it('multi route, the first wins', function(done) {
      router.get('/hello', function*() {
        this.body = 'foo';
      });

      router.get('/hello', function*() {
        this.body = 'bar';
      });

      request(app.listen())
        .get('/hello')
        .expect(200, 'foo', done);
    });
  });
});