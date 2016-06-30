'use strict'

const Toa = require('toa')
const pm = require('toa-pm')
const ilog = require('ilog')
const config = require('config')
const proxyaddr = require('proxy-addr')
const toaBody = require('toa-body')
const toaToken = require('toa-token')
const favicon = require('toa-favicon')
const cookieSession = require('toa-cookie-session')

const router = require('./router')
const limiter = require('./service/limiter')
const packageInfo = require('../package.json')

ilog.level = config.logLevel

const app = module.exports = Toa()

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
app.use(cookieSession({name: config.sessionName, setCookie: false}))
app.use(function * () {
  this.set('Access-Control-Allow-Origin', this.get('origin') || '*')
  this.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  this.set('Access-Control-Allow-Headers', 'Authorization')

  let session = this.session
  let userId = session.uid || (session.user && session.user._id)
  if (!userId) {
    try {
      userId = this.token.userId
    } catch (e) {}
  }

  this.state.userId = /^[a-f0-9]{24}$/.test(userId) ? userId : null
  this.state.ip = this.get('x-real-ip') || proxyaddr(this.req, 'uniquelocal')
  this.state.ua = this.get('user-agent')
})
app.use(limiter)
app.use(router.toThunk())

/**
 * Start up service.
 */
app.listen(config.port, () => {
  ilog.info({
    name: packageInfo.name,
    version: packageInfo.version,
    port: config.port
  })
})
// The server is finally closed and exit gracefully when all connections are ended.
pm(app)
