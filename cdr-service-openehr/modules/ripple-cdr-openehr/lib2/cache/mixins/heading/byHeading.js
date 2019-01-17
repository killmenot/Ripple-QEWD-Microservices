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

const { logger } = require('../../../core');

module.exports = (adapter) => {
  return {

    /**
     * Deletes by heading and source id
     *
     * @param  {string} heading
     * @param  {string} sourceId
     * @return {Promise}
     */
    delete: async (heading, sourceId) => {
      logger.info('cache/headingCache|byHeading|delete', { heading, sourceId });

      const key = ['headings', 'byHeading', heading, sourceId];
      adapter.delete(key);
    },

    /**
     * Deletes all by heading
     *
     * @param  {string} heading
     * @return {Promise}
     */
    deleteAll: async (heading) => {
      logger.info('cache/headingCache|byHeading|deleteAll', { heading });

      const key = ['headings', 'byHeading', heading];
      adapter.delete(key);
    }
  };
};
