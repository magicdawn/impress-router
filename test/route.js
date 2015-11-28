'use strict';

const koa = require('koa');
const request = require('supertest');
const Route = require('../lib/route');
const assert = require('assert');

describe('Route', function() {
  let app;

  beforeEach(function() {
    app = koa();
  });

  it('construct without new', function() {
    Route('/').should.be.ok;
  });

  it('play with route', function(done) {
    const r = Route('/foo');

    app.use(function*(next) {
      const ctx = this;
      yield r.dispatch(next, ctx);
    });

    // r.stack.length = 0

    request(app.listen())
      .get('/foo')
      .expect(404, done);
  });

  it('one route', function(done) {

    const fn = function*() {
      this.body = this.method;
    };

    const r = Route('/foo')
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