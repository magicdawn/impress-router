'use strict';

const koa = require('koa');
const request = require('supertest');
const assert = require('assert');
const METHODS = require('methods');
const Layer = require('../lib/layer');

describe('Layer', function() {
  it('construct without new', function() {
    const l = Layer('/foo', {
      end: true
    }, (ctx) => {
      ctx.body = 'foo';
    });

    l.should.be.ok;
  });

  it('#match(path) return false when path is empty', function() {
    const l = Layer('/foo', {
      end: true
    }, (ctx, next) => {
      ctx.body = 'foo';
    });

    l.match(null).should.equal(false);
    l.match('').should.equal(false);
    l.match('/bar').should.equal(false);
    l.match('/foo').should.equal(true);
  });
});