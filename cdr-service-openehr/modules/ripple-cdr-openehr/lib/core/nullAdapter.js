
/*

 ----------------------------------------------------------------------------
 | ripple-cdr-openehr: Ripple MicroServices for OpenEHR                     |
 |                                                                          |
 | Copyright (c) 2018-19 Ripple Foundation Community Interest Company       |
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

  25 January 2019

*/

'use strict';

const logger = require('./logger');

class NullCacheAdapter {
  exists(key) {
    logger.debug('core/nullAdapter|exists', { key });
  }

  get(key) {
    logger.debug('core/nullAdapter|get', { key });
  }

  getObject(key) {
    logger.debug('core/nullAdapter|getObject', { key });
  }

  getObjectWithArrays(key) {
    logger.debug('core/nullAdapter|getObjectWithArrays', { key });
  }

  put(key, value) {
    logger.debug('core/nullAdapter|put', { key, value });
  }

  putObject(key, value) {
    logger.debug('core/nullAdapter|putObject', { key, value });
  }

  delete(key) {
    logger.debug('core/nullAdapter|delete', { key });
  }
}

module.exports = NullCacheAdapter;
