'use strict'

const config = require('config')
const ratelimit = require('toa-ratelimit')
const redis = require('./redis')

module.exports = ratelimit({
  redis: redis,
  prefix: config.limiter.prefix,
  duration: config.limiter.duration,
  getId: function () {
    return this.state.userId || this.ip
  },
  policy: config.limiter.policy
})
