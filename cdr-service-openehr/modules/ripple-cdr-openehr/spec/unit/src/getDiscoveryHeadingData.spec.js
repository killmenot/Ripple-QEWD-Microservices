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

const Worker = require('../../mocks/worker');
const getDiscoveryHeadingData = require('../../../lib/src/getDiscoveryHeadingData');

describe('ripple-cdr-openehr/lib/src/getDiscoveryHeadingData', () => {
  let q;

  let patientId;
  let heading;
  let jwt;
  let callback;

  beforeEach(() => {
    q = new Worker();
    q.microServiceRouter = jasmine.createSpy()

    patientId = 9999999000;
    heading = 'procedures';
    jwt = 'foo.bar.baz';
    callback = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return empty results', () => {
    heading = 'finished';

    getDiscoveryHeadingData.call(q, patientId, heading, jwt, callback);

    expect(callback).toHaveBeenCalledWith({
      message: {
        status: 'complete',
        results: []
      }
    });
  });

  it('should return discovery response', () => {
    const data = {
      message: {
        responseFrom: 'discovery_service',
        results: []
      }
    };

    q.microServiceRouter.and.callFake((message, callback) => callback(data));

    getDiscoveryHeadingData.call(q, patientId, heading, jwt, callback);

    expect(q.microServiceRouter).toHaveBeenCalledWithContext(q, {
      path: '/api/discovery/9999999000/procedures',
      method: 'GET',
      headers: {
        authorization: 'Bearer foo.bar.baz'
      }
    }, jasmine.any(Function))
    expect(callback).toHaveBeenCalledWith({
      message: {
        responseFrom: 'discovery_service',
        results: []
      }
    });
  });
});
