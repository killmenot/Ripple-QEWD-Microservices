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

  04 October 2018

*/

'use strict';

const login = require('./lib/handlers/login');
const getParams = require('./lib/handlers/getParams');
const getClient = require('./lib/handlers/getClient');
const getUser = require('./lib/handlers/getUser');
const validateUser = require('./lib/handlers/validateUser');
const confirmCode = require('./lib/handlers/confirmCode');
const changePassword = require('./lib/handlers/changePassword');
const requestNewPassword = require('./lib/handlers/requestNewPassword');
const saveGrant = require('./lib/handlers/saveGrant');
const deleteGrant = require('./lib/handlers/deleteGrant');
const keepAlive = require('./lib/handlers/keepAlive');

module.exports = {

  beforeHandler: function (messageObj, session, send, finished) {
    if (messageObj.type === 'login') return;
    if (!session.authenticated) {
      finished({error: 'User MUST be authenticated'});
      return false;
    }
  },

  handlers: {
    login: login,
    getParams: getParams,
    getClient: getClient,
    getUser: getUser,
    validateUser: validateUser,
    confirmCode: confirmCode,
    changePassword: changePassword,
    requestNewPassword: requestNewPassword,
    saveGrant: saveGrant,
    deleteGrant: deleteGrant,
    keepAlive: keepAlive
  }
};
