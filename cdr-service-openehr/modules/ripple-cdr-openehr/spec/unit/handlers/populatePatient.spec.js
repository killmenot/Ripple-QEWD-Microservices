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

  19 July 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/populatePatient', () => {
  let populatePatient;

  let q;
  let args;
  let finished;

  let populatePatientOpenEhr;
  let fetchAndCacheHeading;
  let getHeadingSummary;

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();

    args = {
      patientId: 9999999000,
      heading: 'procedures',
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        userMode: 'admin',
        role: 'IDCR'
      }
    };
    finished = jasmine.createSpy();

    populatePatientOpenEhr = jasmine.createSpy();
    mockery.registerMock('../src/populatePatient', populatePatientOpenEhr);

    fetchAndCacheHeading = jasmine.createSpy();
    mockery.registerMock('../src/fetchAndCacheHeading', fetchAndCacheHeading);

    getHeadingSummary = jasmine.createSpy();
    mockery.registerMock('./getHeadingSummary', getHeadingSummary);

    delete require.cache[require.resolve('../../../lib/handlers/populatePatient')];
    populatePatient = require('../../../lib/handlers/populatePatient');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid request error', () => {
    args.session.userMode = 'idcr';

    populatePatient.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid request'
    });
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    populatePatient.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return cannot populate feeds records error', () => {
    args.heading = 'feeds';

    populatePatient.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Cannot populate feeds records'
    });
  });

  it('should return cannot populate top3Things records error', () => {
    args.heading = 'top3Things';

    populatePatient.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Cannot populate top3Things records'
    });
  });

  it('should return invalid or missing heading error', () => {
    args.heading = 'bar';

    populatePatient.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid or missing heading: bar'
    });
  });

  it('should return heading for patient already has data error', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => callback({ok: true}));

    populatePatient.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith({
      error: 'heading procedures for 9999999000 already has data'
    });
  });

  it('should populate patient', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => callback({ok: false}));
    populatePatientOpenEhr.and.callFake((patientId, heading, callback) => callback());

    populatePatient.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
    expect(populatePatientOpenEhr).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', jasmine.any(Function));
    expect(getHeadingSummary).toHaveBeenCalledWithContext(q, args, finished);
  });
});
