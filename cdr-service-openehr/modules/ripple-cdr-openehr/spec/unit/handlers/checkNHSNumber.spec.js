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

  22 November 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/checkNHSNumber', () => {
  let checkNHSNumberHandler;

  let q;
  let args;
  let finished;

  let checkNHSNumber;
  let qewdSession;

  function checkNHSNumberFake(patientId, email, session, callback) {
    callback({
      new_patient: true
    })
  }

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
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        nhsNumber: 9999999000,
        email: 'john.doe@example.org'
      }
    };
    finished = jasmine.createSpy();

    checkNHSNumber = jasmine.createSpy();
    mockery.registerMock('../src/checkNHSNumber', checkNHSNumber);

    delete require.cache[require.resolve('../../../lib/handlers/checkNHSNumber')];
    checkNHSNumberHandler = require('../../../lib/handlers/checkNHSNumber');

    qewdSession = args.req.qewdSession;
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.session.nhsNumber = 'foo';

    checkNHSNumberHandler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should initiate loading data and return response', () => {
    checkNHSNumber.and.callFake(checkNHSNumberFake)

    checkNHSNumberHandler.call(q, args, finished);

    expect(checkNHSNumber).toHaveBeenCalledWithContext(
      q, 9999999000, 'john.doe@example.org', qewdSession, jasmine.any(Function)
    );

    expect(qewdSession.data.$(['record_status']).getDocument()).toEqual({
      new_patient: true,
      requestNo: 1,
      status: 'loading_data'
    })
    expect(finished).toHaveBeenCalledWith({
      status: 'loading_data',
      new_patient: true,
      responseNo: '',
      nhsNumber: 9999999000
    });
  });

  it('should return response when data still loading', () => {
    qewdSession.data.$(['record_status']).setDocument({
      new_patient: true,
      requestNo: 1,
      status: 'loading_data'
    });

    checkNHSNumberHandler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      status: 'loading_data',
      new_patient: true,
      responseNo: 2,
      nhsNumber: 9999999000
    });
  });

  it('should return response when data loading finished', () => {
    qewdSession.data.$(['record_status']).setDocument({
      new_patient: true,
      requestNo: 2,
      status: 'ready'
    });

    checkNHSNumberHandler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      status: 'ready',
      nhsNumber: 9999999000
    });
  });
});
