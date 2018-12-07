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

describe('ripple-cdr-discovery/lib/src/getHeadingSummary', () => {
  let getHeadingSummary;
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
      heading: 'allergies',
      format : 'pulsetile',
      session: q.sessions.create('app'),
    };

    delete require.cache[require.resolve('../../../lib/src/getHeadingSummary')];
    getHeadingSummary = require('../../../lib/src/getHeadingSummary');
    qewdSession = args.session;
  });

  it('should call getHeadingDetail', () => {
    qewdSession.data.$(['Discovery', 'Patient', 'by_nhsNumber', 5558526785, 'resources', 'AllergyIntolerance']).setDocument(
      {
      585885432 : 'test_resource_585885432',
      585885433 : 'test_resource_585885433'
    });
    qewdSession.data.$(['Discovery', 'AllergyIntolerance', 'by_uuid']).setDocument({
        585885432: {
          data: {},
          practitioner: 'practitioner1'
        },
        585885433: {
          data: {},
        }
      });
    qewdSession.data.$(['Discovery', 'Practitioner', 'by_uuid']).setDocument({
        practitioner1: {
          data : {
            name : {
              text : 'some-text'
            }
          }
        },
      practitioner2: {
        data : {
          name : {
            text : 'some-text'
          }
        }
      }
    });
    getHeadingSummary.call(q, args.nhsNumber, args.heading, args.format, qewdSession);
  });
});
