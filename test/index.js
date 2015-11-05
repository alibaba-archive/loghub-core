'use strict'
/* global describe, before, it, after */

// const assert = require('assert')
const fs = require('fs')
const path = require('path')
const thunk = require('thunks')()
const supertest = require('supertest')
const app = require('../app')
const kafkaClient = require('../service/kafka')

const fsStat = thunk.thunkify(fs.stat)
const request = supertest(app.server)
const user = {userId: '55c1cf622d81b84d4e1d5338'}
const logContent = genLog({test: 'message', LOG_TYPE: 'info'})

describe('Test token authorization', function () {
  var logGifSize

  before(function *() {
    var stats = yield fsStat(path.join(process.cwd(), 'log.gif'))
    logGifSize = stats.size
  })

  after(function *() {
    yield thunk.delay(4000)
  })

  it('Hello', function *() {
    yield request.get('')
      .expect(200)
  })

  it('GET /log without authorization', function *() {
    yield request.get(`/log?log=${logContent}`)
      .expect(401)
  })

  it('POST /log without authorization', function *() {
    yield request.post(`/log`)
      .send({test: 'message'})
      .expect(401)
  })

  it('GET /log.gif without authorization', function *() {
    yield request.get(`/log.gif?log=${logContent}`)
      .expect(401)
  })

  it('Authorization with invalid header token', function *() {
    var token = app.signToken({})
    yield request.get(`/log?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(401)
  })

  it('Authorization with invalid query token', function *() {
    var token = app.signToken({})
    yield request.get(`/log?log=${logContent}&token=${token}`)
      .expect(401)
  })

  it('Authorization with invalid query token', function *() {
    var token = app.signToken({userId: '123'})
    yield request.get(`/log?log=${logContent}&token=${token}`)
      .expect(401)
  })

  it.skip('Authorization with invalid cookie', function *() {
  })

  it('Request without log content', function *() {
    var token = app.signToken(user)
    yield request.get(`/log?token=${token}`)
      .expect(400)
  })

  it('Request with invalid log content', function *() {
    var token = app.signToken(user)
    yield request.get(`/log?log=${genLog({test: 'message'})}&token=${token}`)
      .expect(400)
  })

  it('Request with unrecognized method', function *() {
    var token = app.signToken(user)
    yield request.put(`/log?log=${logContent}&token=${token}`)
      .expect(501)
  })

  it('GET /log, 200', function *() {
    var token = app.signToken(user)
    yield request.get(`/log?log=${logContent}&token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200, {success: true})
  })

  it('POST /log, 500', function *() {
    var token = app.signToken(user)
    yield request.post('/log')
      .set('Authorization', 'Bearer ' + token)
      .send({test: 'message', LOG_TYPE: 'info'})
      .expect(500)
  })

  it('POST /log, 200', function *() {
    var token = app.signToken(user)

    yield kafkaClient.kafkaReady
    yield request.post('/log')
      .set('Authorization', 'Bearer ' + token)
      .send({test: 'message', LOG_TYPE: 'info'})
      .expect('Content-Type', /json/)
      .expect(200, {success: true})
  })

  it('GET /log.gif, 200', function *() {
    var token = app.signToken(user)
    yield request.get(`/log.gif?log=${logContent}&token=${token}`)
      .expect('Content-Type', /gif/)
      .expect('Content-Length', logGifSize)
      .expect(200)
  })

  it('GET /log.gif, 200', function *() {
    var token = app.signToken(user)
    yield request.get(`/log.gif?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect('Content-Type', /gif/)
      .expect('Content-Length', logGifSize)
      .expect(200)
  })
})

function genLog (obj) {
  return encodeURIComponent(JSON.stringify(obj))
}
