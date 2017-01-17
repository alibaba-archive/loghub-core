'use strict'
/* global sneaky */

sneaky('release', function () {
  this.description = 'Deploy to pre-release environment'
  this.user = 'builder'
  this.port = 11122
  this.host = '116.62.16.16'
  this.path = '/teambition/server/loghub-release'
  this.filter = `
+ config
+ config/default.json
+ lib**
+ pm2**
+ app.js
+ test_self.js
+ favicon.ico
+ log.gif
+ npm-shrinkwrap.json
+ package.json
- *`

  this.after('npm i --production && configd config/default.json git://git@code.teambition.com:server/configs.git:teambition/loghub/release.json config/default.json && npm run test-self')
  this.overwrite = true
  this.nochdir = true
})

sneaky('dev', function () {
  this.description = 'Deploy to 21 environment'
  this.user = 'node4'
  this.port = 22
  this.host = '192.168.0.21'
  this.path = '/home/node4/loghub-dev'
  this.filter = `
+ config
+ config/default.json
+ config/development.json
+ lib**
+ pm2**
+ app.js
+ test_self.js
+ favicon.ico
+ log.gif
+ npm-shrinkwrap.json
+ package.json
- *`

  this.after('NODE_ENV=development npm i --production && npm run test-self')
  this.overwrite = true
  this.nochdir = true
})
