'use strict';

var koa = require('koa');
var request = require('supertest');
var Route = require('../lib/route');
var assert = require('assert');
var koa = require('koa');

describe('Route', function() {
  var app;

  beforeEach(function() {
    app = koa();
  });

  it('construct without new', function() {
    Route('/').should.be.ok;
  });

  it('play with route', function(done) {
    var r = Route('/foo');

    app.use(function*(next) {
      var ctx = this;
      yield r.dispatch(next, ctx);
    });

    // r.stack.length = 0

    request(app.listen())
      .get('/foo')
      .expect(404, done);
  });

  it('one route', function(done) {

    var fn = function*() {
      this.body = this.method;
    };

    var r = Route('/foo')
      .get(fn)
      .post(fn)
      .put(fn);

    app.use(function*(next) {
      yield r.dispatch(next, this);
    });

    app = app.callback();

    request(app)
      .delete('/foo')
      .expect(404, done);
  });
});