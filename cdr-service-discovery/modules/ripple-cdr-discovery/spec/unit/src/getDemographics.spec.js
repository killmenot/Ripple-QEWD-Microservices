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

describe('ripple-cdr-discovery/lib/src/getDemographics', () => {
  let getDemographics;

  let args;

  let q;
  let finished;
  let qewdSession;

  function seeds() {
    qewdSession.data.$(['Discovery', 'Patient', 'by_nhsNumber', args.patientId, 'Patient']).setDocument([
      args.patientId
    ]);
  }


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
      patientId: 9999999000,
      practitioner: 9999999001,
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        nhsNumber: 5558526785,
        role: 'phrUser'
      }
    };
    finished = jasmine.createSpy();

    delete require.cache[require.resolve('../../../lib/src/getDemographics')];
    getDemographics = require('../../../lib/src/getDemographics');

    qewdSession = args.req.qewdSession;
    seeds();
  });

  it('should call getDemographics', () => {
    qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', args.patientId]).setDocument(
      {
        data: {
          name: [{
              text: 'Dr. House'
            }],
          address: [{
              text: 'California'
            }],
          telecom: [{
              value: '585-344-6838'
          }],
          gender: [
            'fe',
            'mail'
          ],
        },
        practitioner: args.practitioner
      }
    );
    qewdSession.data.$(['Discovery', 'Practitioner', 'by_uuid', args.practitioner, 'data']).setDocument(
      {
        name: {
          text : 'Dr.Wilson'
        },
        practitionerRole: [
          {
            managingOrganization: {
              reference: 'organization/foo/bar'
            }
          }
        ]
      }
    );
    qewdSession.data.$(['Discovery', 'Organization', 'by_uuid', 'foo', 'data']).setDocument({
      extension : [
        {
          valueReference: {
            reference : 'extension/foo/bar'
          }
        }
      ]
    });
    qewdSession.data.$(['Discovery', 'Location', 'by_uuid', 'foo', 'data']).setDocument({
        address : {
          text : 'new-address-foo'
        }
    });
    getDemographics.call(q, args.patientId, qewdSession);
  });

  it('should call getDemographics with correct patient ID', () => {
    qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', args.patientId]).setDocument(
      {
        data: {
          name: [
            {
              given: [
                'Dr.'
              ],
              family : [
                'House'
              ]
            }
          ],
          address : [{
            postalCode : 58485,
            line : [
              'California',
              'State'
            ]
          }],
          gender: 'male'
        },
        practitioner: args.practitioner,
      }
    );
    qewdSession.data.$(['Discovery', 'Practitioner', 'by_uuid', args.practitioner, 'data']).setDocument(
      {
        name: {
          text : null,
          given: [
            'Dr.'
          ],
          family: [
            'Wilson'
          ]
        },
        practitionerRole: null
      }
    );
    getDemographics.call(q, args.patientId, qewdSession);
  });

  it('should call getDemographics with correct patient ID', () => {
    // qewdSession.data.$(['Discovery', 'Patient', 'by_nhsNumber', args.patientId, 'Patient']).setDocument([
    //   args.patientId
    // ]);
    qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', args.patientId]).setDocument(
      {
        data: {
          name: [
            {
              given: 'Dr.',
              family : 'House'
            }
          ],
          address : [{
            postalCode : 58485,
            line : 'California',
            city : 'State '
          }],
          telecom: '585-344-6838',
          gender: 'male'
        },
        practitioner: args.practitioner,
      }
    );
    qewdSession.data.$(['Discovery', 'Practitioner', 'by_uuid', args.practitioner, 'data']).setDocument(
      {
        name: {
          text : null,
          given: 'Dr.',
          family: 'Wilson'
        },
        practitionerRole: null
      }
    );
    getDemographics.call(q, args.patientId, qewdSession);
  });

  it('should call getDemographics with correct patient ID', () => {
    qewdSession.data.$(['Discovery', 'Patient', 'by_uuid', args.patientId]).setDocument(
      {
        data: {
          name: [
            {
              given: 'Dr.',
              family : 'House'
            }
          ],
          address : [{
            postalCode : 58485,
          }],
          telecom: '585-344-6838',
          gender: 'male'
        },
        practitioner: args.practitioner,
      }
    );
    getDemographics.call(q, args.patientId, qewdSession);
  });

});
