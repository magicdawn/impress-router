'use strict'
const app = require('./app')
const server = app.listen()
const request = require('supertest')

/**
 * middleware
 */
request(server)
  .get('/public/js/app.js')
  .end(function(err, res) {
    console.log(res.body)
  })

/**
 * route
 */
request(server)
  .get('/hello')
  .end(function(err, res) {
    console.log(res.text)
  })

/**
 * nested router
 */
request(server)
  .get('/a/b/c')
  .end(function(err, res) {
    // console.log(err);
    console.log(res.body)
  })

/**
 * simple params
 */
request(server)
  .get('/user/magicdawn/detail')
  .end(function(err, res) {
    console.log(res.body)
  })

/**
 * nested params
 */
request(server)
  .get('/user/magicdawn/age')
  .end(function(err, res) {
    console.log(res.body)
  })
