var app = require('koa')();
var should = require('should');
var request = require('supertest');
var Router = require('../lib/router');

describe('router should be ok', function() {

  it('ok with/without new', function() {
    var router = new Router();
    (typeof router).should.equal('function');
    router.constructor.name.should.equal('GeneratorFunction');

    router = Router();
    (typeof router).should.equal('function');
    router.constructor.name.should.equal('GeneratorFunction');
  });

});