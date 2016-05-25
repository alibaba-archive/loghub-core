'use strict'

const fs = require('fs')
const path = require('path')
const ilog = require('ilog')
const kafkaClient = require('../service/kafka')
const logGif = fs.readFileSync(path.join(process.cwd(), 'log.gif'))

const logLevels = Object.create(null)
ilog.levels.map(function (level) {
  logLevels[level] = logLevels[level.toLowerCase()] = true
})

exports.get = function * () {
  // Authenticate session cookie or authorization token.
  if (!this.state.userId) this.throw(401)

  let log = checkLog(this, this.query.log)
  kafkaClient.saveLogs(genMessage(this, log, this.state.userId))

  if (this.path !== '/log.gif') {
    this.body = {success: true}
  } else {
    this.set('Cache-Control', 'private, max-age=0, no-cache')
    this.type = 'image/gif'
    this.body = logGif
  }
}

exports.post = function * () {
  // Authenticate session cookie or authorization token.
  if (!this.state.userId) this.throw(401)

  let log = yield this.parseBody()
  log = checkLog(this, log)

  yield kafkaClient.saveLogsAsync(genMessage(this, log, this.state.userId))
  this.body = {success: true}
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
