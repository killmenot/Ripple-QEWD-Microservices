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

  20 December 2018

*/

'use strict';

const { logger } = require('../core');

class DiscoveryDb {
  constructor(ctx) {
    this.ctx = ctx;
    this.discoveryMap = ctx.worker.db.use('DiscoveryMap');
  }

  static create(ctx) {
    return new DiscoveryDb(ctx);
  }

  /**
   * Gets sourceId by discovery sourceId
   *
   * @param  {string} discoverySourceId
   * @return {Promise.<string>}
   */
  async getSourceIdByDiscoverySourceId(discoverySourceId) {
    logger.info('db/discoveryDb|getSourceIdByDiscoverySourceId', { discoverySourceId });

    const node = this.discoveryMap.$(['by_discovery_sourceId', discoverySourceId]);

    return node.exists ? node.value : null;
  }

  /**
   * Gets by sourceId
   *
   * @param  {string} sourceId
   * @return {Promise.<Object>}
   */
  async getBySourceId(sourceId) {
    logger.info('db/discoveryDb|getBySourceId', { sourceId });

    const node = this.discoveryMap.$(['by_openehr_sourceId', sourceId]);

    return node.exists ? node.getDocument() : null;
  }

  /**
   * Checks by sourceId
   *
   * @param  {string} sourceId
   * @return {Promise.<bool>}
   */
  async checkBySourceId(sourceId) {
    logger.info('db/discoveryDb|checkBySourceId', { sourceId });

    const node = this.discoveryMap.$(['by_openehr_sourceId', sourceId]);

    return node.exists;
  }

  /**
   * Gets all sourceIds
   *
   * @return {Promise.<string[]>}
   */
  async getAllSourceIds() {
    logger.info('db/discoveryDb|getAllSourceIds');

    const dbData = [];
    const node = this.discoveryMap.$(['by_openehr_sourceId']);

    node.forEachChild((sourceId) => {
      dbData.push(sourceId);
    });

    return dbData;
  }

  /**
   * Gets all sourceIds by some condition
   *
   * @param  {Function} filter
   * @return {Promise.<string[]>}
   */
  async getSourceIds(filter) {
    logger.info('db/discoveryDb|getAllSourceIds');

    const dbData = [];
    const node = this.discoveryMap.$(['by_openehr_sourceId']);

    node.forEachChild((sourceId, n) => {
      if (filter(n.getDocument())) {
        dbData.push(sourceId);
      }
    });

    return dbData;
  }

  /**
   * Inserts a new db record
   *
   * @param  {string} discoverySourceId
   * @param  {string} sourceId
   * @param  {Object} data
   * @return {Promise}
   */
  async insert(discoverySourceId, sourceId, data) {
    logger.info('db/discoveryDb|insert', { discoverySourceId, sourceId, data });

    this.discoveryMap.$(['by_discovery_sourceId', discoverySourceId]).value = sourceId;
    this.discoveryMap.$(['by_openehr_sourceId', sourceId]).setDocument(data);
  }

  /**
   * Deletes an existing new db record
   *
   * @param  {string} discoverySourceId
   * @param  {string} sourceId
   * @return {Promise}
   */
  async delete(discoverySourceId, sourceId) {
    logger.info('db/discoveryDb|delete', { discoverySourceId, sourceId });

    this.discoveryMap.$(['by_discovery_sourceId', discoverySourceId]).delete();
    this.discoveryMap.$(['by_openehr_sourceId', sourceId]).delete();
  }
}

module.exports = DiscoveryDb;
