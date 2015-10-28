'use strict'

const config = require('config')

const logAPI = module.exports = {}

logAPI.get = function *() {
  var token

  // TODO: Add support for session cookie authentication.

  token = this.token

  // Check necessary if fields are provided.
  if (!token._id) this.throw('User id is required.', 400)
  var log = this.query.log
  if (!log) this.throw('Log has no content.', 400)

  var payload = [{
    topic: config.kafkaTopic,
    messages: log
  }]

  // Commit logs to kafka.
  yield this.kafkaClient.send(payload)

  this.body = {
    token: token,
    log: log
  }
}
