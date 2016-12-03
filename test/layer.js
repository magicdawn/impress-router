'use strict'

const koa = require('koa')
const request = require('supertest')
const assert = require('assert')
const METHODS = require('methods')
const Layer = require('../lib/layer')

describe('Layer', function() {
  it('#match(path) return false when path is empty', function() {
    const l = new Layer('/foo', {
      end: true
    }, (ctx, next) => {
      ctx.body = 'foo'
    })

    l.match(null).should.equal(false)
    l.match('').should.equal(false)
    l.match('/bar').should.equal(false)
    l.match('/foo').should.equal(true)
  })
})