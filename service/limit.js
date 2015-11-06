'use strict'

const config = require('config')
const ratelimit = require('toa-ratelimit')
const redis = require('./redis')

const ratelimitT = ratelimit({
  db: redis.client,
  prefix: config.rateLimitPrefix,
  duration: 10 * 60 * 1000
})

exports.get = function (userId) {
  return ratelimitT.limit(`${userId}GET`, config.rateLimitMaxGet)
}

exports.post = function (userId) {
  return ratelimitT.limit(`${userId}POST`, config.rateLimitMaxPost)
}
