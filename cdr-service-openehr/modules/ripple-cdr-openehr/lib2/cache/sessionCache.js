/*

 ----------------------------------------------------------------------------
 | ripple-cdr-openehr: Ripple MicroServices for OpenEHR                     |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
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

  30 December 2018

*/

'use strict';

const { logger } = require('../core');

class SessionCache {
  constructor(adapter) {
    this.adapter = adapter;
  }

  static create(adapter) {
    return new SessionCache(adapter);
  }

  /**
   * Gets a session for a host
   *
   * @param  {string} host
   * @return {Promise}
   */
  async get(host) {
    logger.info('cache/sessionCache|get', { host  });

    const key = ['openEHR', 'sessions', host];

    return this.adapter.getObject(key);
  }

  /**
   * Sets a session for a host
   *
   * @param  {string} host
   * @param  {Object} session
   * @return {Promise}
   */
  async set(host, session) {
    logger.info('cache/sessionCache|set', { host, session });

    const key = ['openEHR', 'sessions', host];
    this.adapter.putObject(key, session);
  }

  /**
   * Deletes a session for a host
   *
   * @param  {string} host
   * @return {Promise}
   */
  async delete(host) {
    logger.info('cache/sessionCache|delete', { host });

    const key = ['openEHR', 'sessions', host];
    this.adapter.delete(key);
  }
}

module.exports = SessionCache;
