'use strict'

const fs = require('fs')
const path = require('path')
const tman = require('tman')
const assert = require('assert')
const config = require('config')
const crypto = require('crypto')
const thunk = require('thunks')()
const supertest = require('supertest')

const app = require('../app')
const kafkaClient = require('../lib/service/kafka')

const fsStat = thunk.thunkify(fs.stat)
const request = supertest(app.server)
const logContent = genLog({test: 'message', LOG_TYPE: 'info'})
const user = genUser()

tman.suite('Test token authorization', function () {
  var logGifSize
  this.timeout(5000)

  tman.before(function * () {
    var stats = yield fsStat(path.join(process.cwd(), 'log.gif'))
    logGifSize = stats.size
  })

  tman.after(function * () {
    yield thunk.delay(2000)
  })

  tman.it('Hello', function * () {
    yield request.get('')
      .expect(200)
  })

  tman.it('GET /log without authorization', function * () {
    yield request.get(`/log?log=${logContent}`)
      .expect(401)
  })

  tman.it('POST /log without authorization', function * () {
    yield request.post('/log')
      .send({test: 'message'})
      .expect(401)
  })

  tman.it('GET /log.gif without authorization', function * () {
    yield request.get(`/log.gif?log=${logContent}`)
      .expect(401)
  })

  tman.it('Authorization with invalid header token', function * () {
    var token = app.signToken({})
    yield request.get(`/log?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect(401)
  })

  tman.it('Authorization with invalid query token', function * () {
    var token = app.signToken({})
    yield request.get(`/log?log=${logContent}&token=${token}`)
      .expect(401)
  })

  tman.it('Authorization with invalid query token', function * () {
    var token = app.signToken({userId: '123'})
    yield request.get(`/log?log=${logContent}&token=${token}`)
      .expect(401)
  })

  tman.it.skip('Authorization with invalid cookie', function * () {
  })

  tman.it('Request without log content', function * () {
    var token = app.signToken(user)
    yield request.get(`/log?token=${token}`)
      .expect(400)
  })

  tman.it('Request with invalid log content', function * () {
    var token = app.signToken(user)
    yield request.get(`/log?log=${genLog({test: 'message'})}&token=${token}`)
      .expect(400)
  })

  tman.it('Request with unrecognized method', function * () {
    var token = app.signToken(user)
    yield request.put(`/log?log=${logContent}&token=${token}`)
      .expect(404)
  })

  tman.it('GET /log, 200', function * () {
    var token = app.signToken(user)
    yield request.get(`/log?log=${logContent}&token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200, {success: true})
  })

  tman.it('POST /log, 200', function * () {
    var token = app.signToken(user)

    if (app.config.env === 'development') return

    yield kafkaClient.kafkaReady
    yield request.post('/log')
      .set('Authorization', 'Bearer ' + token)
      .send({test: 'message', LOG_TYPE: 'info'})
      .expect('Content-Type', /json/)
      .expect(200, {success: true})
  })

  tman.it('GET /log.gif, 200', function * () {
    var token = app.signToken(user)
    yield request.get(`/log.gif?log=${logContent}&token=${token}`)
      .expect('Content-Type', /gif/)
      .expect('Content-Length', String(logGifSize))
      .expect(200)
  })

  tman.it('GET /log.gif, 200', function * () {
    var token = app.signToken(user)
    yield request.get(`/log.gif?log=${logContent}`)
      .set('Authorization', 'Bearer ' + token)
      .expect('Content-Type', /gif/)
      .expect('Content-Length', String(logGifSize))
      .expect(200)
  })

  tman.it('GET /log, 429', function * () {
    var user = genUser()
    var token = app.signToken(user)
    var i = config.limiter.policy.GET[0] + 1
    var url = `/log?log=${logContent}&token=${token}`
    var status = []
    while (i--) {
      yield request.get(url)
        .expect(function (res) {
          status.push(res.status)
        })
    }

    assert.strictEqual(status[status.length - 2], 200)
    assert.strictEqual(status[status.length - 1], 429)
  })

  tman.it('POST /log, 429', function * () {
    if (app.config.env === 'development') return
    var user = genUser()
    var token = app.signToken(user)
    var i = config.limiter.policy.POST[0] + 1
    var status = []
    while (i--) {
      yield request.post('/log')
        .set('Authorization', 'Bearer ' + token)
        .send({test: 'message', LOG_TYPE: 'info'})
        .expect(function (res) {
          status.push(res.status)
        })
    }
    assert.strictEqual(status[status.length - 2], 200)
    assert.strictEqual(status[status.length - 1], 429)
  })
})

function genUser () {
  return {userId: crypto.createHash('md5').update(crypto.randomBytes(256)).digest('hex').slice(0, 24)}
}

function genLog (obj) {
  return encodeURIComponent(JSON.stringify(obj))
}
