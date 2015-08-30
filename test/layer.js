var koa = require('koa');
var request = require('supertest');
var assert = require('assert');
var METHODS = require('methods');
var Layer = require('../lib/layer');

describe('Layer', function() {
  it('construct without new', function() {
    var l = Layer('/foo', {
      end: true
    }, function * () {
      this.body = 'foo';
    });

    l.should.be.ok;
  });

  it('#match(path) return false when path is empty', function() {
    var l = Layer('/foo', {
      end: true
    }, function * () {
      this.body = 'foo';
    });

    l.match(null).should.equal(false);
    l.match('').should.equal(false);
  });
});