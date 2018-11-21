/*

 ----------------------------------------------------------------------------
 | ripple-admin: Ripple User Administration MicroService                    |
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

  3 August 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../mocks/worker');

describe('ripple-mpi/lib/loadPatients', () => {
  let q;
  let loadPatients;

  function getPatientsMock() {
    return {
      '9999999000': {
        id: 9999999000,
        name: 'Jane Doe'
      }
    };
  }

  function seeds() {
    const phrPatients = q.db.use('RipplePHRPatients');
    phrPatients.$('byId').setDocument({
      '07881112222': {
        id: '07881112222',
        name: 'John Doe'
      }
    });
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

    delete require.cache[require.resolve('../../data/patients.json')];
    mockery.registerMock('../data/patients.json', getPatientsMock());

    loadPatients = require('../../lib/loadPatients');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });


  it('should return false when patients data exists', () => {
    seeds();

    const actual = loadPatients.call(q);

    expect(actual).toBeFalsy();
  });

  it('should return true when patients data loaded', () => {
    const phrPatients = q.db.use('RipplePHRPatients');

    const actual = loadPatients.call(q);

    expect(actual).toBeTruthy();
    expect(phrPatients.getDocument()).toEqual({
      byId: {
        '9999999000': { id: 9999999000, name: 'Jane Doe'}
      },
      byName: {
        'Jane Doe': { '9999999000': 9999999000 }
      }
    });
  });
});
