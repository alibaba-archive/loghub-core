'use strict'

const config = require('config')
const redis = require('thunk-redis')
const tools = require('./tools')

const client = redis.createClient(config.redisPort, config.redisHost)

client
  .on('connect', function () {
    tools.logInfo('thunk-redis', {
      redisHost: config.redisHost,
      redisPort: config.redisPort,
      message: 'connected'
    })
  })
  .on('error', tools.logErr)
  .on('warn', function (err) {
    tools.logInfo('thunk-redis', err)
  })
  .on('close', function (hadErr) {
    if (hadErr) return tools.logErr(hadErr)
  })

exports.client = client
