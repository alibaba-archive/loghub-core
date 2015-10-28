'use strict'
/*global describe, it*/

const assert = require('assert')
const supertest = require('supertest')
const app = require('../app')
const request = supertest(app.server)
const user = {_id: 123}
const logContent = 'testlog: ' + new Date().toString()

describe('Test token authorization', function () {
  it('Without authorization', function *() {
    yield request.get(`/log/query?log=${logContent}`)
      .expect(401)
  })

  it('Authorization with invalid token', function *() {
    var token = app.signToken({})
    yield request.get(`/log/query?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(401)
  })

  it('Authorization with invalid cookie', function *() {
    yield request.get(`/log/query?log=${logContent}`)
      .set('cookie', '')
      .expect(401)
  })

  it('Request without log content', function *() {
    var token = app.signToken(user)
    yield request.get(`/log/query`)
      .set('Authorization', 'Bearer ' + token)
      .expect(400)
  })

  it('Commit logs successfully with token', function *() {
    var token = app.signToken(user)

    yield request.get(`/log/query?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(200)
      .expect(function (res) {
        assert.strictEqual(res.body.token._id, user._id)
        assert.strictEqual(res.body.log, logContent)
      })
  })

  it('Commit logs successfully with session cookie', function *() {
    var cookie = new Buffer(JSON.stringify({user: user})).toString('base64')

    yield request.get(`/log/query?log=${logContent}`)
      .set('cookie', cookie)
      .expect(200)
      .expect(function (res) {
        assert.strictEqual(res.body.token._id, user._id)
        assert.strictEqual(res.body.log, logContent)
      })
  })
})
