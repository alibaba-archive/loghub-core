'use strict'
/*global describe, it*/

const config = require('config')
const assert = require('assert')
const supertest = require('supertest')
const app = require('../app')
const request = supertest(app.server)
const kafka = require('kafka-node')
const Consumer = kafka.Consumer
const client = new kafka.Client()
const user = {_id: 123}
const logContent = 'testlog: ' + new Date().toString()

describe('Test token authorization', function () {
  it('Without autheorization', function (done) {
    request.get(`/log/query?log=${logContent}`)
      .expect(401)
      .end(done)
  })

  it('Token without _id provided', function (done) {
    var token = app.signToken({})
    request.get(`/log/query?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
      .end(done)
  })

  it('Request without log content', function (done) {
    var token = app.signToken(user)
    request.get(`/log/query`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
      .end(done)
  })

  // TODO: Add tests for session cookie authorization.

  it('Send message successfully', function (done) {
    var token = app.signToken(user)
    var consumer = new Consumer(client, [{topic: config.kafkaTopic}], {autoCommit: false})
    consumer.once('message', function (message) {
      done()
    })

    request.get(`/log/query?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect(function (res) {
        assert.strictEqual(res.body.token._id, user._id)
        assert.strictEqual(res.body.log, logContent)
      })
  })
})
