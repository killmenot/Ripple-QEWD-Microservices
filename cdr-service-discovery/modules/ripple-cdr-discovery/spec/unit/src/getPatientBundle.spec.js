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
 | Licensed under the Apache License, Version 2.0 (the 'License');          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an 'AS IS' BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  28 November 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-discovery/lib/src/getPatientBundle', () => {

  let getPatientBundle;
  let q;
  let args;
  let qewdSession;

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterEach(() => {
    mockery.deregisterAll();
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();
    args = {
      nhsNumber: 5558526785,
      session: q.sessions.create('app'),
    };

    delete require.cache[require.resolve('../../../lib/src/getPatientBundle')];
    getPatientBundle = require('../../../lib/src/getPatientBundle');
    qewdSession = args.session;
  });

  it('should call getPatientBundle', () => {
    getPatientBundle.call(q, args.nhsNumber, qewdSession);
  });

  it('should cachedPatientBundle exists', () => {
    qewdSession.data.$(['Discovery', 'PatientBundle']).setDocument({
      resourceType: 'Bundle',
      entry: []
    });
    getPatientBundle.call(q, args.nhsNumber, qewdSession);
  });

  it('should be cachedPatient', () => {
    qewdSession.data.$(['Discovery', 'Patient']).setDocument({
      patientId: 9999999000,
    });
    getPatientBundle.call(q, args.nhsNumber, qewdSession);
  });

  it('should create bundle from cachedPatient', () => {
    qewdSession.data.$(['Discovery', 'Patient', 'by_nhsNumber', args.nhsNumber, 'Patient']).setDocument([
      {uuid: 1},
      {uuid: 2},
      {uuid: 3},
      {uuid: 4}
    ]);
    getPatientBundle.call(q, args.nhsNumber, qewdSession);
  })

});
