'use strict'

const config = require('config')
const ilog = require('ilog')

module.exports = ilog

ilog.level = config.logLevel
