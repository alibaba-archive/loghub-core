'use strict'

const fs = require('fs')
const path = require('path')
const ilog = require('../service/log')
const saveLogs = require('../service/kafka').saveLogs
const logGif = fs.readFileSync(path.join(process.cwd(), 'log.gif'))

const logLevels = Object.create(null)
ilog.levels.map(function (level) {
  logLevels[level] = logLevels[level.toLowerCase()] = true
})

exports.get = function () {
  // Authenticate session cookie or authorization token.
  var userId = authenticateUser(this)

  let log = checkLog(this, this.query.log)
  saveLogs(genMessage(this, log, userId))

  if (this.path !== '/log.gif') {
    this.body = {success: true}
  } else {
    this.set('Cache-Control', 'private, max-age=0, no-cache')
    this.type = 'image/gif'
    this.body = logGif
  }
}

exports.post = function *() {
  // Authenticate session cookie or authorization token.
  var userId = authenticateUser(this)

  let log = yield this.parseBody()
  log = checkLog(this, log)
  saveLogs(genMessage(this, log, userId))
  this.body = {success: true}
}

function authenticateUser (ctx) {
  var userId
  try {
    userId = ctx.token.userId
  } catch (e) {
    let session = ctx.session
    userId = (session.user && session.user._id) || session.uid
  }

  if (!userId || !/^[a-f0-9]{24}$/.test(userId)) {
    ctx.throw(401, 'Either token or cookie is invalid.')
  }
  return userId
}

function checkLog (ctx, log) {
  if (typeof log === 'string') {
    try {
      log = JSON.parse(decodeURIComponent(log))
    } catch (err) {
      ctx.throw(400, String(err))
    }
  }
  // log should be object and has a valid type
  if (log && logLevels[log.type]) return log
  ctx.throw(400)
}

function genMessage (ctx, log, userId) {
  let message = JSON.stringify({
    log: log,
    uid: userId,
    ip: ctx.state.ip,
    ua: ctx.state.ua
  })
  return `[${new Date().toISOString()}] ${log.type.toUpperCase()} ${message}`
}
