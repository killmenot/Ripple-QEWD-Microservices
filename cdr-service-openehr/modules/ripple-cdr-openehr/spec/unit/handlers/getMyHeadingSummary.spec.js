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

describe('ripple-cdr-openehr/lib/handlers/getMyHeadingSummary', () => {
  let getMyHeadingSummary;

  let q;
  let args;
  let finished;

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
      session: {
        nhsNumber: 9434765919
      }
    };
    finished = jasmine.createSpy();

    getHeadingSummary = jasmine.createSpy();
    mockery.registerMock('./getHeadingSummary', getHeadingSummary);

    delete require.cache[require.resolve('../../../lib/handlers/getMyHeadingSummary')];
    getMyHeadingSummary = require('../../../lib/handlers/getMyHeadingSummary');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return get heading summary for correct patientId', () => {
    getMyHeadingSummary.call(q, args, finished);

    expect(args.patientId).toBe(9434765919);
    expect(getHeadingSummary).toHaveBeenCalledWithContext(q, args, finished);
  });
});
