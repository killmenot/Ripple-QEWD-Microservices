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

const { BadRequestError } = require('../errors');
const { RecordStatus } = require('../shared/enums');
const { isPatientIdValid } = require('../shared/validation');
const debug = require('debug')('ripple-cdr-openehr:commands:check-nhs-number');

class CheckNhsNumberCommand {
  constructor(ctx, session) {
    this.ctx = ctx;
    this.session = session;
    this.statusService = this.ctx.services.statusService;
  }

  /**
   * @return {Promise.<Object>}
   */
  async execute() {
    let state = null;

    const patientId = this.session.nhsNumber;
    debug('patientId: %s', patientId);

    const valid = isPatientIdValid(patientId);
    if (!valid.ok) {
      throw new BadRequestError(valid.error);
    }

    state = await this.statusService.check();
    debug('state: %j', state);

    if (state && state.status === RecordStatus.LOADING) {
      return {
        status: state.status,
        new_patient: state.new_patient,
        responseNo: state.requestNo,
        nhsNumber: patientId
      };
    }

    if (state && state.status === RecordStatus.READY) {
      return {
        status: RecordStatus.READY,
        nhsNumber: patientId
      };
    }

    // see index.js for workerResponseHandler that is invoked when this has completed
    // where it will next fetch any new heading data from Discovery and write it into EtherCIS record

    debug('first time this API has been called in this user session');
    const initialState = {
      status: RecordStatus.LOADING,
      new_patient: 'not_known_yet',
      requestNo: 1
    };
    await this.statusService.create(initialState);

    const host = this.ctx.defaultHost;
    const { created } = await this.ctx.services.patientService.check(host, patientId);

    if (created) {
      const feed = {
        email: this.session.email,
        author: 'Helm PHR service',
        name: 'Leeds Live - Whats On',
        landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
        rssFeedUrl: 'https://www.leeds-live.co.uk/news/?service=rss'
      };
      debug('add the standard feed: %j', feed);

      await this.ctx.services.phrFeedService.create(feed);
    }

    state = await this.statusService.get();
    debug('record state: %j', state);
    state.new_patient = created;
    await this.statusService.update(state);

    return {
      status: RecordStatus.LOADING,
      new_patient: created,
      responseNo: state.requestNo,
      nhsNumber: patientId
    };
  }
}

module.exports = CheckNhsNumberCommand;
