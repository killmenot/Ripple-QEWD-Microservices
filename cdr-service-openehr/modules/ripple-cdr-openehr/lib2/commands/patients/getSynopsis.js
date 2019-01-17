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

  22 December 2018

*/

'use strict';

const { BadRequestError } = require('../../errors');
const { isPatientIdValid } = require('../../shared/validation');
const { Role } = require('../../shared/enums');
const debug = require('debug')('ripple-cdr-openehr:commands:patients:get-synopsis');

class GetPatientSynopsisCommand {
  constructor(ctx, session) {
    this.ctx = ctx;
    this.session = session;
  }

  /**
   * @param  {string} patientId
   * @param  {Object} query
   * @return {Object}
   */
  async execute(patientId, query) {
    debug('patientId: %s, heading: %s, query: %j', patientId, query);
    debug('role: %s', this.session.role);

    // override patientId for PHR Users - only allowed to see their own data
    if (this.session.role === Role.PHR_USER) {
      patientId = this.session.nhsNumber;
    }

    const patientValid = isPatientIdValid(patientId);
    if (!patientValid.ok) {
      throw new BadRequestError(patientValid.error);
    }

    const synopsisConfig = this.ctx.synopsisConfig;
    debug('synopsis config: %j', synopsisConfig);

    const { headingService } = this.ctx.services;
    await headingService.fetchMany(patientId, synopsisConfig.headings);

    debug('headings %s for %s is cached', synopsisConfig.headings, patientId);

    const synopsisCount = query.maximum || synopsisConfig.maximum;
    debug('synopsis max count: %s', synopsisCount);

    const responseObj = await headingService.getSynopses(patientId, synopsisConfig.headings, synopsisCount);
    debug('response: %j', responseObj);

    return responseObj;
  }
}

module.exports = GetPatientSynopsisCommand;
