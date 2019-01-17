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

  31 December 2018

*/

'use strict';

const P = require('bluebird');
const { logger } = require('../core');
const { ExtraHeading } = require('../shared/enums');
const debug = require('debug')('ripple-cdr-openehr:dispatchers:discovery');

class DiscoveryDispatcher {
  constructor(q) {
    this.q = q;
  }

  /**
   * Gets discovery data
   *
   * @private
   * @param  {string|int} patientId
   * @param  {string} heading
   * @param  {string} jwt
   * @return {Promise.<Object>}
   */
  async getDiscoveryData(patientId, heading, jwt) {
    logger.info('dispatchers/discoveryDispatcher|getDiscoveryData', { patientId, heading, jwt: typeof jwt });

    debug('jwt: %s', jwt);

    return new Promise((resolve, reject) => {
      if (heading === ExtraHeading.FINISHED) {
        return resolve({
          message: {
            status: 'complete',
            results: []
          }
        });
      }

      const message = {
        path: `/api/discovery/${patientId}/${heading}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${jwt}`
        }
      };

      debug('message: %j', message);

      this.q.microServiceRouter.call(this.q, message, (responseObj) => {
        debug('handle response from micro service: patientId = %s, heading = %s, responseObj = %j', patientId, heading, responseObj);
        if (responseObj.error) return reject(responseObj);

        return resolve(responseObj.message);
      });
    });
  }

  /**
   * Merge discovery data in worker process
   *
   * @private
   * @param  {string|int} patientId
   * @param  {Object} data
   * @param  {string} jwt
   * @return {Promise.<Object>}
   */
  async mergeDiscoveryData(heading, data, jwt) {
    logger.info('dispatchers/discoveryDispatcher|mergeDiscoveryData', { heading, data, jwt: typeof jwt  });

    debug('jwt: %s', jwt);

    return new Promise((resolve, reject) => {
      const token = this.q.jwt.handlers.getProperty('uid', jwt);
      const messageObj = {
        application: 'ripple-cdr-openehr',
        type: 'restRequest',
        path: `/discovery/merge/${heading}`,
        pathTemplate: '/discovery/merge/:heading',
        method: 'GET',
        headers: {
          authorization: `Bearer ${jwt}`
        },
        args: {
          heading: heading
        },
        data: data,
        token: token
      };

      debug('message: %j', messageObj);

      this.q.handleMessage(messageObj, (responseObj) => {
        debug('heading %s has been merged into EtherCIS', heading);
        if (responseObj.error) return reject(responseObj);

        return resolve(responseObj.message);
      });
    });
  }

  /**
   * Sync single heading data using discovery microservice
   *
   * @private
   * @param  {string|int} patientId
   * @param  {string} heading
   * @param  {string} jwt
   * @return {Promise}
   */
  async sync(patientId, heading, jwt) {
    logger.info('dispatchers/discoveryDispatcher|sync', { patientId, heading, jwt: typeof jwt  });

    debug('jwt: %s', jwt);

    try {
      const discoveryData = await this.getDiscoveryData(patientId, heading, jwt);
      await this.mergeDiscoveryData(heading, discoveryData, jwt);
    } catch (err) {
      logger.error('dispatchers/discoveryDispatcher|sync|err: ' + err.message);
      logger.error('dispatchers/discoveryDispatcher|sync|stack: ' + err.stack);
    }
  }

  /**
   * Dispatches sync all headings data using discovery microservice
   *
   * @public
   * @param  {string|int} patientId
   * @param  {string[]} headings
   * @param  {string} jwt
   * @return {Promise}
   */
  async syncAll(patientId, headings, jwt) {
    logger.info('dispatchers/discoveryDispatcher|syncAll', { patientId, headings, jwt: typeof jwt  });

    debug('jwt: %s', jwt);

    await P.each(headings, (heading) => this.sync(patientId, heading, jwt));
    logger.info('discovery data loaded into EtherCIS');
  }
}

module.exports = DiscoveryDispatcher;
