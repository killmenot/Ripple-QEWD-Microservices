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

  function registerAsync() {
    return this.send_promise({
      type: 'ewd-register',
      application: 'qewd-openid-connect'
    });
  }

  function loginAsync() {
    return this.send_promise({
      type: 'login',
      params: {
        password: this.userDefined.config.managementPassword
      }
    });
  }

  function getParamsAsync() {
    const message = {
      type: 'getParams'
    };

    if (documents) {
      message.params = {
        documents: documents,
        documentsPath: DOCUMENTS_PATH
      };
    }

    return this.send_promise(message);
  }

  function handleError(err) {
    /*eslint-disable no-console*/
    console.error(err);
    /*eslint-enable no-console*/
  }

  // start the QEWD session for database interactions
  registerAsync.call(this).then(result => {
    debug('ewd-register|result = %j', result);

    this.openid_server.token = result.message.token;

    return loginAsync.call(this);
  }).then(result => {
    debug('login|result = %j', result);

    return getParamsAsync.call(this);
  }).then(result => {
    debug('getParams|result = %j', result);

    // start up the OpenID Connect Server
    Object.keys(result.message).forEach((name) => {
      params[name] = result.message[name];
    });
    load.call(this, app, bodyParser, params);
  }).catch(handleError);
}

module.exports = start;
