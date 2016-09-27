'use strict'

const config = require('config')
const kafka = require('kafka-node')
const ilog = require('ilog')
const thunk = require('thunks')()

const client = new kafka.Client(config.kafka.host, 'loghub-core')
const producer = new kafka.Producer(client)

const sendLog = process.env.NODE_ENV !== 'test'
  ? thunk.thunkify.call(producer, producer.send) : function (messages) {
    return function (callback) {
      callback(null, messages)
    }
  }

var kafkaReady = false
const queue = []

exports.isReady = new Promise(function (resolve, reject) {
  client.on('ready', resolve)
})
exports.isReady.then(function () {
  kafkaReady = true
  if (queue.length) {
    exports.saveLogs(queue.slice())
    queue.length = 0
  }
  ilog.info({name: 'kafka', config: config.kafka})
})

// the application should restart if error occured
client.on('error', function (error) {
  ilog.emergency(error)
  throw error
})

exports.saveLogs = function (message) {
  if (!kafkaReady) {
    queue.push(message)
    return
  }
  // Commit logs to kafka.
  sendLog([new Payload(message)])(ilog.error)
}

exports.saveLogsAsync = function * (message) {
  yield sendLog([new Payload(message)])
  return true
}

function Payload (messages) {
  this.messages = messages
}

Payload.prototype.topic = config.kafka.topic
Payload.prototype.partition = config.kafka.partition
Payload.prototype.attributes = 0

exports.testSelf = function * () {
  yield yield exports.isReady
  return 'Ok'
}
