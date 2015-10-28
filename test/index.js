'use strict'
/*global describe, it*/

const assert = require('assert')
const supertest = require('supertest')
const app = require('../app')
const request = supertest(app.server)
const user = {_id: 123}
const logContent = 'testlog: ' + new Date().toString()

describe('Test token authorization', function () {
  it('Without autheorization', function *() {
    yield request.get(`/log/query?log=${logContent}`)
      .expect(401)
  })

  it('Token without _id provided', function *() {
    var token = app.signToken({})
    yield request.get(`/log/query?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
  })

  it('Request without log content', function *() {
    var token = app.signToken(user)
    yield request.get(`/log/query`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
  })

  // TODO: Add tests for session cookie authorization.

  it('Commit logs successfully', function *() {
    var token = app.signToken(user)

    yield request.get(`/log/query?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect(function (res) {
        assert.strictEqual(res.body.token._id, user._id)
        assert.strictEqual(res.body.log, logContent)
      })
  })
})
