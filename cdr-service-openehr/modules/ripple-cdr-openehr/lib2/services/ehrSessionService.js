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

const config = require('../config');
const { logger } = require('../core');
const { EhrSessionError } = require('../errors');
const debug = require('debug')('ripple-cdr-openehr:services:ehr-session');

class EhrSessionService {
  constructor(ctx) {
    this.ctx = ctx;
  }

  static create(ctx) {
    return new EhrSessionService(ctx);
  }

  /**
   * Start session
   *
   * @param  {string} host
   * @return {Promise.<Object>}
   */
  async start(host) {
    logger.info('services/ehrSessionService|start', { host });

    const now = new Date().getTime();
    const { sessionCache } = this.ctx.cache;
    const cachedSession = await sessionCache.get(host);

    // when starting a session, try to use a cached one instead if possible
    if (cachedSession) {
      if ((now - cachedSession.creationTime) < config.openehr.sessionTimeout) {
        // should be OK to use cached session
        debug('%s using cached session for %s', process.pid, host);

        return {
          sessionId: cachedSession.id
        };
      }

      debug('deleting expired cached session for %s', host);
      await this.stop(host, cachedSession.id);

      await sessionCache.delete(host);
    }

    const ehrRestService = this.ctx.openehr[host];
    const data = await ehrRestService.startSession();
    if (!data || !data.sessionId) {
      logger.error(`start session response was unexpected: ${JSON.stringify(data)}`);
      throw new EhrSessionError(`Unable to establish a session with ${host}`);
    }

    const session = {
      creationTime: now,
      id: data.sessionId
    };
    await sessionCache.set(host, session);
    debug('session %s for %s host has been cached', host, data.sessionId);

    return {
      sessionId: data.sessionId
    };
  }

  /**
   * Stop session
   *
   * @param  {string} host
   * @param  {string} sessionId
   * @return {Promise.<bool>}
   */
  async stop(host, sessionId) {
    logger.info('services/ehrSessionService|stop', { host, sessionId });

    const now = new Date().getTime();
    const { sessionCache } = this.ctx.cache;
    const cachedSession = await sessionCache.get(host);

    // only stop sessions that are over `sessionTimeout` old
    if (cachedSession) {
      if ((now - cachedSession.creationTime) < config.openehr.sessionTimeout) {
        // don't stop this session or remove it from cache
        debug('%s cached session for %s not shut down', host);

        return false;
      }

      // remove cached session id and continue to send request to shut it down on OpenEHR system
      debug('shutting down session for %s', host);
      await sessionCache.delete(host);
    }

    const ehrRestService = this.ctx.openehr[host];
    await ehrRestService.stopSession(sessionId);

    return true;
  }
}

module.exports = EhrSessionService;
