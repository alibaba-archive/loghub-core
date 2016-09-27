'use strict'

const config = require('config')
config.port += 10000
require('./app')

const ilog = require('ilog')
const thunk = require('thunks')()
const urllib = require('urllib')
const kafka = require('./lib/service/kafka')
const redis = require('./lib/service/redis')

thunk.race([
  function * () {
    yield thunk.delay(3000)
    throw new Error('Self test timeout!')
  },
  function * () {
    let time = Date.now()
    // should not shrow error.
    ilog.info('Check Kafka...')
    ilog('Kafka result', yield kafka.testSelf())

    ilog.info('Check Redis...')
    ilog('Redis result:', yield redis.testSelf())

    ilog.info('Check App Server...')
    let res = yield urllib.request(`http://localhost:${config.port}`)
    ilog('App result:', res.res)

    ilog.info(`Self test success, ${Date.now() - time} ms!`)
  }
])((err) => {
  if (err) ilog(err)
  process.exit(err ? 1 : 0)
})
