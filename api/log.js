'use strict'

const fs = require('fs')
const path = require('path')
const ilog = require('../service/log')
const kafkaClient = require('../service/kafka')
const logGif = fs.readFileSync(path.join(process.cwd(), 'log.gif'))

const logLevels = Object.create(null)
ilog.levels.map(function (level) {
  logLevels[level] = logLevels[level.toLowerCase()] = true
})

exports.get = function () {
  // Authenticate session cookie or authorization token.
  var userId = authenticateUser(this)

  let log = checkLog(this, this.query.log)
  kafkaClient.saveLogs(genMessage(this, log, userId))

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

  var response = kafkaClient.saveLogsSync(genMessage(this, log, userId))
  this.body = {success: response}
}

function authenticateUser (ctx) {
  let session = ctx.session
  let userId = (session.user && session.user._id) || session.uid

  if (!userId) userId = ctx.token.userId
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
  // log should be object and has a valid type on `LOG_TYPE`
  if (log && logLevels[log.LOG_TYPE]) return log
  ctx.throw(400)
}

function genMessage (ctx, log, userId) {
  let message = JSON.stringify({
    log: log,
    uid: userId,
    ip: ctx.state.ip,
    ua: ctx.state.ua
  })
  return `[${new Date().toISOString()}] ${log.LOG_TYPE.toUpperCase()} ${message}`
}
