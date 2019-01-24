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

const { ExecutionContext, logger } = require('../lib/core');

function mapNhsNoByHost(patientId, host, ehrSession, callback) {
  const ctx = new ExecutionContext(this);
  const { patientService } = ctx.services;

  patientService.getEhrId(host, patientId)
    .then(ehrId => callback(ehrId))
    .catch(err => {
      logger.error('modules/mapNhsNoByHost|err: ' + err.message);
      logger.error('modules/mapNhsNoByHost|stack: ' + err.stack);
    });
}
module.exports = mapNhsNoByHost;
