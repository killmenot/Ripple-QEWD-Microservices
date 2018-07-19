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

describe('ripple-cdr-openehr/lib/handlers/getMyHeadingDetail', () => {
  let getMyHeadingDetail;

  let q;
  let args;
  let finished;

  let getHeadingDetail;

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

    getHeadingDetail = jasmine.createSpy();
    mockery.registerMock('./getHeadingDetail', getHeadingDetail);

    delete require.cache[require.resolve('../../../lib/handlers/getMyHeadingDetail')];
    getMyHeadingDetail = require('../../../lib/handlers/getMyHeadingDetail');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return get heading detail for correct patientId', () => {
    getMyHeadingDetail.call(q, args, finished);

    expect(args.patientId).toBe(9434765919);
    expect(getHeadingDetail).toHaveBeenCalledWithContext(q, args, finished);
  });
});
