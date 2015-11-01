'use strict'

const Toa = require('toa')
const pm = require('toa-pm')
const config = require('config')
const toaBody = require('toa-body')
const toaToken = require('toa-token')
const favicon = require('toa-favicon')
const cookieSession = require('toa-cookie-session')
const router = require('./service/router')

const app = Toa(function *() {
  this.set('Access-Control-Allow-Origin', this.get('origin') || '*')
  this.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, HEAD, OPTIONS')
  this.set('Access-Control-Allow-Headers', 'Authorization, Content-Length, Content-MD5, Content-Type, X-Requested-With')
  // TODO https://github.com/jshttp/proxy-addr
  this.state.ip = this.ip
  this.state.ua = this.get('user-agent')
  // Handle requests for committing logs.
  yield router.route(this)
})

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
