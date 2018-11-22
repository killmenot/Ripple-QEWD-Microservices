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

const Master = require('../../mocks/master');
const mergeDiscoveryDataInWorker = require('../../../lib/src/mergeDiscoveryDataInWorker');

describe('ripple-cdr-openehr/lib/src/mergeDiscoveryDataInWorker', () => {
  let q;

  let patientId;
  let heading;
  let jwt;
  let discoveryData;
  let callback;

  beforeEach(() => {
    q = new Master();
    q.microServiceRouter = jasmine.createSpy()

    patientId = 9999999000;
    heading = 'procedures';
    jwt = 'foo.bar.baz';
    discoveryData = {
      quux: 'baz'
    }
    callback = jasmine.createSpy();
  });

  it('should send message to discovery service', () => {
    const data = {
      foo: 'bar'
    }

    q.jwt.handlers.getProperty.and.returnValue('some.token');
    q.handleMessage.and.callFake((message, callback) => callback(data));

    mergeDiscoveryDataInWorker.call(q, patientId, heading, jwt, discoveryData, callback);

    expect(q.jwt.handlers.getProperty).toHaveBeenCalledWith('uid', 'foo.bar.baz');
    expect(q.handleMessage).toHaveBeenCalledWith({
      application: 'ripple-cdr-openehr',
      type: 'restRequest',
      path: '/discovery/merge/procedures',
      pathTemplate: '/discovery/merge/:heading',
      method: 'GET',
      headers: {
        authorization: 'Bearer foo.bar.baz'
      },
      args: {
        heading: 'procedures'
      },
      data: {
        quux: 'baz'
      },
      token: 'some.token'
    }, jasmine.any(Function));

    expect(callback).toHaveBeenCalledWith({
      foo: 'bar'
    });
  });
});
