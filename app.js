'use strict'

const Toa = require('toa')
const pm = require('toa-pm')
const config = require('config')
const proxyaddr = require('proxy-addr')
const toaBody = require('toa-body')
const toaToken = require('toa-token')
const favicon = require('toa-favicon')
const cookieSession = require('toa-cookie-session')

const ilog = require('./service/log')
const router = require('./service/router')
const packageInfo = require('./package.json')

const app = Toa(function *() {
  this.set('Access-Control-Allow-Origin', this.get('origin') || '*')
  this.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  this.set('Access-Control-Allow-Headers', 'Authorization')

  this.state.ip = this.get('x-real-ip') || proxyaddr(this.req, 'uniquelocal')
  this.state.ua = this.get('user-agent')

  yield router.route(this)
})

app.onerror = function (error) {
  // ignore 4xx error
  if (error && error.status < 500) return
  ilog.error(error)
}

app.keys = config.sessionSecret

toaToken(app, config.tokenSecret, {
  expiresInSeconds: config.expires,
  getToken: function () {
    if (this.method !== 'GET') return
    // GET requests permits both authorization headers and signature query.
    return this.query.token
  }
})

toaBody(app, {
  formLimit: '56kb',
  jsonLimit: '56kb'
})

app.use(favicon('favicon.ico'))
app.use(cookieSession({name: config.sessionName}))

/**
 * Start up service.
 */
app.listen(config.port)
// The server is finally closed and exit gracefully when all connections are ended.
pm(app)
module.exports = app

ilog.info({name: packageInfo.name, version: packageInfo.version, port: config.port})
