'use strict'

const logAPI = module.exports = {}

logAPI.get = function () {
  var token

  // TODO: Add support for session cookie authentication.

  token = this.token

  if (!token._id) this.throw('User id is required.', 400)
  var log = this.query.log
  if (!log) this.throw('Log has no content.', 400)

  // TODO: Commit logs to kafka.

  this.body = {
    token: token,
    log: log
  }
}
