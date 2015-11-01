'use strict'

const config = require('config')
const kafka = require('kafka-node')
const Producer = kafka.Producer
const producerClient = new kafka.Client(config.host)
const client = new Producer(producerClient)

client.on('ready', function () {
  console.log('Kafka producer is ready.')
})

client.on('error', function (err) {
  console.error(`\n${err.toString()}`, `\n${err.stack}`)
})

exports.client = client
