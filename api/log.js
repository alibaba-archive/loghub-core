'use strict'

const fs = require('fs')
const path = require('path')
const config = require('config')
const kafkaClient = require('./service/kafka').client
const gifLog = fs.readFileSync(path.join(process.cwd(), 'log.gif'))

exports.get = function () {
  // Authenticate session cookie or authorization token.
  var userId = authenticateUser(this)

  // Check necessary if fields are provided.
  if (!userId || !/^[a-f0-9]{24}$/.test(userId)) {
    this.throw(401, 'Either token or cookie is invalid.')
  }

  let log = checkLog(this, this.query.log)
  sendLog(log, userId, this.state.ip, this.state.ua)

  if (this.path !== '/log.gif') this.status = 204
  else {
    this.set('Cache-Control', 'private')
    this.type = 'image/gif'
    this.body = gifLog
  }
}

exports.post = function *() {
  // Authenticate session cookie or authorization token.
  var userId = authenticateUser(this)

  // Check necessary if fields are provided.
  if (!userId || !/^[a-f0-9]{24}$/.test(userId)) {
    this.throw(401, 'Either token or cookie is invalid.')
  }

  let log = yield this.parseBody()
  log = checkLog(this, log)
  sendLog(log, userId, this.state.ip, this.state.ua)
  this.status = 204
}

function authenticateUser (ctx) {
  var token
  try {
    token = this.token
    return token.userId
  } catch (e) {
    token = this.session
    return token._id || (token.user && token.user._id)
  }
}

function checkLog (ctx, log) {
  if (!log) ctx.throw(400, 'Log has no content.')

  try {
    log = JSON.parse(log)
    if (hasContent(log)) return log
  } catch (err) {
    ctx.throw(400, String(err))
  }

  ctx.throw(400, 'Log has no content.')
}

function sendLog (log, userId, ip, ua) {
  // Commit logs to kafka.
  kafkaClient.send(new Payload(log, userId, ip, ua), function (err, data) {
    if (err) console.error(err)
  })
}

function hasContent (obj) {
  if (!obj) return false
  return !!Object.keys(obj).length
}

function Payload (log, userId, ip, ua, partition) {
  this.messages = JSON.stringify({
    log: log,
    uid: userId,
    ip: ip,
    ua: ua
  })
  if (partition >= 0) this.partition = Math.floor(partition)
}

Payload.prototype.topic = config.kafkaTopic
Payload.prototype.partition = config.partition
Payload.prototype.attributes = 0
