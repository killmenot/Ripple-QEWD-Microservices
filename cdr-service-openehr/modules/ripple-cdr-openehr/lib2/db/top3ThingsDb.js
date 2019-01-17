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

  15 December 2018

*/

'use strict';

const { logger } = require('../core');

class Top3ThingsDb {
  constructor(ctx) {
    this.ctx = ctx;
    this.top3Things = ctx.worker.db.use('Top3Things');
  }

  static create(ctx) {
    return new Top3ThingsDb(ctx);
  }

  /**
   * Gets latest source id
   *
   * @param  {string|int} patientId
   * @return {Promise.<string|null>}
   */
  async getLatestSourceId(patientId) {
    logger.info('db/Top3ThingsDb|getLatestSourceId', { patientId });

    const node = this.top3Things.$(['byPatient', patientId, 'latest']);

    return node.exists ? node.value : null;
  }

  /**
   * Sets latest source id
   *
   * @param  {string|int} patientId
   * @param  {string} sourceId
   * @return {Promise}
   */
  async setLatestSourceId(patientId, sourceId) {
    logger.info('db/Top3ThingsDb|getLatestSourceId', { patientId, sourceId });

    this.top3Things.$(['byPatient', patientId, 'latest']).value = sourceId;
  }

  /**
   * Gets data by source id
   *
   * @param  {string} sourceId
   * @return {Promise.<Object|null>}
   */
  async getBySourceId(sourceId) {
    logger.info('db/Top3ThingsDb|getBySourceId', { sourceId });

    const node = this.top3Things.$(['bySourceId', sourceId]);

    return node.exists ? node.getDocument() : null;
  }

  /**
   * Inserts a new db record
   *
   * @param  {string|int} patientId
   * @param  {string} sourceId
   * @param  {Object} top3Things
   * @return {Promise.<Object>}
   */
  async insert(patientId, sourceId, top3Things) {
    logger.info('db/Top3ThingsDb|insert', { patientId, sourceId, top3Things });

    this.top3Things.$(['bySourceId', sourceId]).setDocument(top3Things);
    this.top3Things.$(['byPatient', patientId, 'byDate', top3Things.date]).value = sourceId;
  }
}

module.exports = Top3ThingsDb;
