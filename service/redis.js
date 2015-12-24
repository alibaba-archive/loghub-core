'use strict'

const config = require('config')
const redis = require('thunk-redis')
const ilog = require('ilog')

const client = module.exports = redis.createClient(config.redisHosts, config.redisOptions)

client.on('error', function (err) {
  ilog.error(err)
  // the application should restart if error occured
  throw err
})
