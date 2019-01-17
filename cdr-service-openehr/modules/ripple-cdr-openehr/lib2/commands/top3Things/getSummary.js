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

  19 December 2018

*/

'use strict';

const { BadRequestError } = require('../../errors');
const { isPatientIdValid } = require('../../shared/validation');
const debug = require('debug')('ripple-cdr-openehr:commands:top3things:get-summary');

class GetTop3ThingsSummaryCommand {
  constructor(ctx, session) {
    this.ctx = ctx;
    this.session = session;
  }

  /**
   * @param  {string} patientId
   * @return {Promise.<Object[]>}
   */
  async execute(patientId) {
    debug('patientId: %s', patientId);

    // override patientId for PHR Users - only allowed to see their own data
    if (this.session.role === 'phrUser') {
      patientId = this.session.nhsNumber;
    }

    const valid = isPatientIdValid(patientId);
    if (!valid.ok) {
      throw new BadRequestError(valid.error);
    }

    const { top3ThingsService } = this.ctx.services;
    const responseObj = await top3ThingsService.getLatestSummaryByPatientId(patientId);

    return responseObj;
  }
}

module.exports = GetTop3ThingsSummaryCommand;
