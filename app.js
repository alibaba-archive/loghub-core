'use strict'

const config = require('config')
const Toa = require('toa')
const pm = require('toa-pm')
const toaToken = require('toa-token')
const Router = require('toa-router')

const packageInfo = require('./package.json')
const logAPI = require('./api/log')

const router = new Router()
  .get('', function () {
    this.body = {
      server: packageInfo.name,
      version: packageInfo.version
    }
  })
  .get('/log/(*)', logAPI.get)

const app = module.exports = Toa(function *() {
  if (this.path !== '/') console.log(this.token)
  yield router.route(this)
})

toaToken(app, config.tokenSecret, {
  expiresInSeconds: config.expires,
  getToken: function () {
    if (this.method !== 'GET') return
    // GET requests permits both authorization headers and signature query.
    return this.query.token
  }
})
/**
 * Start up service.
 */
module.exports = app.listen(config.port)
// The server is finally closed and exit gracefully when all connections are ended.
pm(app)
