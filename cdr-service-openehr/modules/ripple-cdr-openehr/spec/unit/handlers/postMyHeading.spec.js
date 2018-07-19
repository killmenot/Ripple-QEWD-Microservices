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

describe('ripple-cdr-openehr/lib/handlers/postMyHeading', () => {
  let postMyHeading;

  let q;
  let args;
  let finished;

  let postPatientHeading;

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
      session: {
        nhsNumber: 9434765919
      }
    };
    finished = jasmine.createSpy();

    postPatientHeading = jasmine.createSpy();
    mockery.registerMock('./postPatientHeading', postPatientHeading);

    delete require.cache[require.resolve('../../../lib/handlers/postMyHeading')];
    postMyHeading = require('../../../lib/handlers/postMyHeading');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return get heading summary for correct patientId', () => {
    postMyHeading.call(q, args, finished);

    expect(args.patientId).toBe(9434765919);
    expect(postPatientHeading).toHaveBeenCalledWithContext(q, args, finished);
  });
});
