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

  27 November 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/revertDiscoveryData', () => {
  let q;

  let args;
  let finished;

  let revertDiscoveryData;
  let deletePatientHeading;

  function seeds() {
    const DiscoveryMap = q.db.use('DiscoveryMap');

    DiscoveryMap.$(['by_discovery_sourceId']).setDocument({
      'eaf394a9-5e05-49c0-9c69-c710c77eda76': 'ethercis-bar',
      '2c9a7b22-4cdd-484e-a8b5-759a70443be3': 'ethercis-foo',
      '2c9a7b22-4cdd-484e-a8b5-759a70443be4': 'ethercis-foo-bar'
    });
    DiscoveryMap.$(['by_openehr_sourceId']).setDocument({
      'ethercis-foo': {
        discovery: 'eaf394a9-5e05-49c0-9c69-c710c77eda76',
        heading: 'procedures',
        openehr: 'foo::vm01.ethercis.org::1',
        patientId: 9999999000
      },
      'ethercis-bar': {
        discovery: '2c9a7b22-4cdd-484e-a8b5-759a70443be3',
        heading: 'contacts',
        openehr: 'bar::vm01.ethercis.org::1',
        patientId: 9999999111
      },
      'ethercis-foo-bar': {
        discovery: '2c9a7b22-4cdd-484e-a8b5-759a70443be3',
        heading: 'procedures',
        openehr: 'bar::vm01.ethercis.org::1',
        patientId: 9999999000
      }
    });
  }

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  beforeEach(() => {
    q = new Worker();

    args = {
      patientId: 9999999000,
      heading: 'procedures',
      session: {
        userMode: 'admin'
      }
    };
    finished = jasmine.createSpy();

    deletePatientHeading = jasmine.createSpy();
    mockery.registerMock('./deletePatientHeading', deletePatientHeading);

    delete require.cache[require.resolve('../../../lib/handlers/revertDiscoveryData')];
    revertDiscoveryData = require('../../../lib/handlers/revertDiscoveryData');

    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  afterAll(() => {
    mockery.disable();
  });

  it('should revert discovery data', () => {
    revertDiscoveryData.call(q, args, finished);
  });

  it('should heading not valid', () => {
    args.heading = null;

    revertDiscoveryData.call(q, args, finished);
  });

  it('should patientID not valid', () => {
    args.patientId = '';

    revertDiscoveryData.call(q, args, finished);
  });

  it('should delete patient heading', () => {
    deletePatientHeading.and.callFake((args, callback) => {
      return callback({
        deleted: true,
        patientId: args.patientId,
        heading: args.heading,
        compositionId: 'some.compositionId',
        host: 'ethercis'
      })
    });

    seeds();

    revertDiscoveryData.call(q, args, finished);

    expect(deletePatientHeading).toHaveBeenCalledTimes(2);
  });

  it('should were no matching records', () => {
    args.heading = 'counts';

    revertDiscoveryData.call(q, args, finished);

    expect(deletePatientHeading).not.toHaveBeenCalled();
    expect(finished).toHaveBeenCalledWith([]);
  });
});
