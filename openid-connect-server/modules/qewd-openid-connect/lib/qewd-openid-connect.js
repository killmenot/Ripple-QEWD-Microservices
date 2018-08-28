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

const DOCUMENTS_PATH = '/opt/qewd/mapped/documents.json';
const load = require('./loader');
const qewd_interface = require('./qewd_interface');
const debug = require('debug')('qewd-openid-connect:qewd-openid-connect');

let documents;
try {
  documents = require(DOCUMENTS_PATH);
  debug('documents loaded: %j', documents);
}
catch(err) {
  debug('error during loading documents: %s', err);
}

function start(app, bodyParser, params) {

  qewd_interface.call(this);

  // start the QEWD session for database interactions
  this.send_promise({
    type: 'ewd-register',
    application: 'qewd-openid-connect'
  }).then((result) => {
    debug('ewd-register|result = %j', result);

    this.openid_server.token = result.message.token;
    this.send_promise({
      type: 'login',
      params: {
        password: this.userDefined.config.managementPassword
      }
    }).then((result) => {
      debug('login|result = %j', result);

      // fetch or generate the keystore & config params
      const msg = {
        type: 'getParams'
      };

      if (documents) {
        msg.params = {
          documents: documents,
          documentsPath: DOCUMENTS_PATH
        };
      }

      this.send_promise(msg).then((result) => {
        debug('getParams|result = %j', result);

        // start up the OpenID Connect Server
        Object.keys(result.message).forEach((name) => {
          params[name] = result.message[name];
        });

        load.call(this, app, bodyParser, params);
      });
    });
  });
}

module.exports = start;
