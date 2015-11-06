'use strict'

const config = require('config')
const redis = require('thunk-redis')
const ilog = require('./log')

const client = redis.createClient(config.redisHosts, config.redisOptions)

client
  .on('connect', function () {
    ilog.info({
      name: 'redis',
      host: config.redisHosts,
      options: config.redisOptions
    })
  })
  .on('error', function (error) {
    ilog.emergency(error)
    // the application should restart if error occured
    throw error
  })

exports.client = client
