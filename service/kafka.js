'use strict'

const config = require('config')
const kafka = require('kafka-node')
const ilog = require('./log')
const thunk = require('thunks')()

const client = new kafka.Client(config.kafka.host, 'loghub-core')
const producer = new kafka.Producer(client)

const queue = []
var kafkaReady = false

client.on('ready', function () {
  kafkaReady = true
  if (queue.length) {
    exports.saveLogs(queue)
    queue.length = 0
  }
  ilog.info({name: 'kafka', config: config.kafka})
})

client.on('error', ilog.error)

exports.saveLogs = function (message) {
  if (!kafkaReady) {
    queue.push(message)
    return
  }

  // Commit logs to kafka.
  producer.send([new Payload(message)], function (error, res) {
    ilog.auto(error)
  })
}

exports.saveLogsSync = function (message) {
  if (!kafkaReady) {
    queue.push(message)
    return false
  }

  var success = true
  var commitLogs = thunk.thunkify.call(producer, producer.send)
  commitLogs([new Payload(message)])(function (err, res) {
    if (err) {
      ilog.error(err)
      success = false
    }
  })

  return success
}

function Payload (messages) {
  this.messages = messages
}

Payload.prototype.topic = config.kafka.topic
Payload.prototype.partition = config.kafka.partition
Payload.prototype.attributes = 0
