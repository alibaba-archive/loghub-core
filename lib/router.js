'use strict'

const Router = require('toa-router')

const logAPI = require('./api/log')
const packageInfo = require('../package.json')

const router = module.exports = new Router()

router
  .get('/', function () {
    this.body = {
      server: packageInfo.name,
      version: packageInfo.version
    }
  })
  .get('/log', logAPI.get)
  .post('/log', logAPI.post)
  .get('/log.gif', logAPI.get)
  .otherwise(function () {
    this.throw(404)
  })
