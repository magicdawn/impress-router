var app = require('./app');
var server = app.listen();
var request = require('supertest');

/**
 * middleware
 */
request(server)
  .get('/public/js/app.js')
  .end(function(err, res) {
    console.log(res.body);
  });

/**
 * route
 */
request(server)
  .get('/hello')
  .end(function(err, res) {
    console.log(res.text);
  });