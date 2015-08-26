var koa = require('koa');
var should = require('should');
var request = require('supertest');
var Router = require('../lib/router');

describe('router should be ok', function() {
  var app;
  var router;

  beforeEach(function() {
    app = koa();
    router = Router();
    app.use(router);
  });

  it('ok with/without new', function() {
    var router = new Router();
    (typeof router).should.equal('function');
    router.constructor.name.should.equal('GeneratorFunction');

    router = Router();
    (typeof router).should.equal('function');
    router.constructor.name.should.equal('GeneratorFunction');
  });

  /**
   * middleware
   */
  describe('middleware', function() {
    it('use a middleware on a /path', function(done) {

      router.use('/public', function * () {
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
          var j = res.body;

          // assert
          j.originalPath.should.equal('/public/js/foo.js')
          j.basePath.should.equal('/public');
          j.path.should.equal('/js/foo.js');

          done();
        });
    });

    it('fast_slash middleware', function(done) {
      router.use(function * () {
        this.body = 'awesome site';
      });

      request(app.listen())
        .get('/')
        .end(function(err, res) {
          res.text.should.match(/awesome/);
          done();
        });
    });
  });

  /**
   * route
   */
  describe('route', function() {

    it('have route handle correctly', function(done) {
      router.get('/foo/bar', function * () {
        this.body = this.path;
      });

      request(app.listen())
        .get('/foo/bar')
        .end(function(err, res) {
          res.text.should.equal('/foo/bar');
          done();
        });
    });

    it('simple params', function(done) {
      router.get('/user/:id', function * () {
        this.body = this.params.id;
      });

      request(app.listen())
        .get('/user/magicdawn')
        .end(function(err, res) {
          res.text.should.equal('magicdawn');
          done();
        });
    });
  });
});