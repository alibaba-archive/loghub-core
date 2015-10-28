'use strict'

const config = require('config')
const kafka = require('kafka-node')
const KeyedMessage = kafka.KeyedMessage

const logAPI = module.exports = {}

logAPI.get = function *() {
  // Authenticate session cookie or authorization token.
  var token
  if (this.request.header.cookie) {
    token = JSON.parse(new Buffer(this.request.header.cookie, 'base64').toString('utf8')).user
  } else {
    token = this.token
  }

  // Check necessary if fields are provided.
  if (!token._id) this.throw('User id is required.', 401)
  var log = this.query.log
  if (!log) this.throw('Log has no content.', 400)

  var logMessage = new KeyedMessage('log', log)
  var idMessage = new KeyedMessage('_id', token._id)
  var payload = {
    topic: config.kafkaTopic,
    messages: [logMessage, idMessage],
    partition: parseInt(this.query.partition, 10) || 0,
    attributes: parseInt(this.query.attributes, 10) || 0
  }

  // Commit logs to kafka.
  yield this.kafkaClient.send([payload], function (err, data) {
    if (err) throw err
  })

  this.body = {
    token: token,
    log: log,
    userID: token._id
  }
}
