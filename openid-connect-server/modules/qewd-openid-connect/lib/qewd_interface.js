/*

 ----------------------------------------------------------------------------
 | qewd-openid-connect: QEWD-enabled OpenId Connect Server                  |
 |                                                                          |
 | Copyright (c) 2018 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  4 July 2018

*/

'use strict';

const debug = require('debug')('qewd-openid-connect:qewd-interface');

module.exports = async function () {

  this.openid_server = {};

  const handleMessagePromise = function (messageObj) {
    return new Promise((resolve) => {
      this.handleMessage(messageObj, function (responseObj) {
        resolve(responseObj);
      });
    });
  };

  async function sendAsync(message) {
    //message.application = 'openid-server';
    //message.expressType = message.type;
    //message.type = 'ewd-qoper8-express';
    debug('sendAsync: openid_server = %j', this.openid_server);
    if (this.openid_server.token) message.token = this.openid_server.token;

    return await handleMessagePromise.call(this, message);
  }

  this.send_promise = sendAsync.bind(this);

};
