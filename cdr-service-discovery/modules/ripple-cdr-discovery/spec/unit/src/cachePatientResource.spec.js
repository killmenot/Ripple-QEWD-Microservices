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

const Worker = require('../../mocks/worker');

describe('ripple-cdr-discovery/lib/src/cachePatientResource', () => {
  let cachePatientResource;

  let q;
  let args;
  let qewdSession;
  let callback;


  beforeEach(() => {
    q = new Worker();
    args = {
      nhsNumber: 5558526785,
      session: q.sessions.create('app'),
      patientResource: {
        entry: [
          {
            resource: {
              id: 585848485,
              name: 'PatientNameFoo'
            },
          },
          {
            resource: {
              id: 585848484,
              name: 'PatientNameBar'
            },
          }
        ]
      }
    };

    callback = jasmine.createSpy();

    delete require.cache[require.resolve('../../../lib/src/cachePatientResource')];
    cachePatientResource = require('../../../lib/src/cachePatientResource');

    qewdSession = args.session;
  });

  it('should call cachePatientResource', () => {
    qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', 585848483, 'data']).setDocument('some-foo-data');
    qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', 585848482, 'data']).setDocument('some-foo-data');
    cachePatientResource.call(q, args.nhsNumber, args.patientResource, qewdSession, callback);
    expect(qewdSession.data.$(['Discovery', 'Patient','by_uuid', 585848485, 'data']).getDocument()).toEqual(args.patientResource.entry[0].resource);
    expect(qewdSession.data.$(['Discovery', 'Patient','by_uuid', 585848484, 'data']).getDocument()).toEqual(args.patientResource.entry[1].resource);
    expect(qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', 585848485, 'nhsNumber']).value).toEqual(args.nhsNumber);
    expect(qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', 585848484, 'nhsNumber']).value).toEqual(args.nhsNumber);
    expect(qewdSession.data.$(['Discovery', 'Patient','by_nhsNumber', args.nhsNumber, 'Patient', 585848484]).value).toEqual(585848484);
    expect(qewdSession.data.$(['Discovery', 'Patient','by_nhsNumber', args.nhsNumber, 'Patient', 585848485]).value).toEqual(585848485);
  });

});
