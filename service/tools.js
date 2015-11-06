'use strict'

const util = require('util')

exports.logInfo = logInfo
function logInfo (name, obj) {
  // stdout
  name = `\n${timestamp()} - ${name}`
  if (!obj) console.log(name)
  else if (util.isError(obj)) console.log(name, `\n${obj.toString()}`)
  else console.log(name, `\n${JSON.stringify(obj)}`)
}

exports.logErr = logErr
function logErr (err) {
  // stdout
  // ignore null and response error
  if (err == null || (err.status && err.status < 500)) return
  if (!util.isError(err)) logInfo('Non-Error throw', err)
  else console.error(`\n${timestamp()} - ${err.toString()}`, `\n${err.stack}`)
}

function timestamp () {
  var d = new Date()
  var date = [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-')
  var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':')
  return date + ' ' + time
}

function pad (n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10)
}
