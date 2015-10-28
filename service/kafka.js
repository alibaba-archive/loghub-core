'use strict'

const host = process.env['KAFKA_HOST'] || ''
const kafka = require('kafka-node')
const Producer = kafka.Producer
const producerClient = new kafka.Client(host)
const client = new Producer(producerClient)

client.on('ready', function () {
  console.log('Kafka producer is ready.')
})

client.on('error', function (err) {
  console.error(`\n${err.toString()}`, `\n${err.stack}`)
})

exports.client = client
