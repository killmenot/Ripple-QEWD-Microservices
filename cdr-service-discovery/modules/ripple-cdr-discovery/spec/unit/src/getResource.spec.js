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
const nock = require('nock');

describe('ripple-cdr-discovery/lib/src/getResource', () => {
  let getResource;

  let q;
  let args;
  let qewdSession;
  let callback;


  function httpMock(data, responseData, responseCode) {
    nock('https://deveds.endeavourhealth.net/data-assurance')
    .get(`/api/fhir/reference?reference=resource%2F6848939595%2Fdata`)
    .reply(responseCode, responseData);
  }

  function httpMockWithError(data, responseData) {
    nock('https://deveds.endeavourhealth.net/data-assurance')
    .get(`/api/fhir/reference?reference=resource%2F6848939595%2Fdata`)
    .replyWithError(responseData)
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
      nhsNumber: 5558526785,
      session: q.sessions.create('app'),
      resourceName: 'resource',
      reference: 'resource/6848939595/data',
      token: 'some-jwt-token',
      uuid: 6848939594
    };

    callback = jasmine.createSpy();

    delete require.cache[require.resolve('../../../lib/src/getResource')];
    getResource = require('../../../lib/src/getResource');

    qewdSession = args.session;
  });

  it('should call getResource', () => {
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', args.uuid]).setDocument({
      data: 'some-data'
    });
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', args.uuid, 'fetchingResource', args.reference]).setDocument({
      data: 'some-data'
    });

    getResource.call(q, args.reference, args.token, qewdSession, callback);
  });

  it('should call request', (done) => {
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', 6848939594]).setDocument({
      resource: {
        id : 6848939594
      }
    });
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', args.uuid, 'fetchingResource', args.reference]).setDocument({
      data: 'some-data'
    });
    httpMock(args.reference, {id : 6848939594}, 200);
    getResource.call(q, args.reference, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(false, {id : 6848939594});
      done();
    }, 100);
  });

  it('should call request with empty body', (done) => {
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', 6848939594]).setDocument({
      resource: {
        id : 6848939594
      }
    });
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', args.uuid, 'fetchingResource', args.reference]).setDocument({
      data: 'some-data'
    });
    httpMock(args.reference, '', 200);
    getResource.call(q, args.reference, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(false, {});
      done();
    }, 100);
  });

  it('should beingFetched exist', () => {
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', 6848939594]).setDocument({
      resource: {
        id : 6848939594
      }
    });
    qewdSession.data.$(['fetchingResource', 'resource/6848939595/data']).setDocument({
      data: 'some-data'
    });
    getResource.call(q, args.reference, args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalledWith(false);
  });

  it('should session exists', () => {
    qewdSession.data.$(['Discovery', args.resourceName, 'by_uuid', 6848939594]).setDocument({
      resource: {
        id : 6848939594
      }
    });
    qewdSession.data.$(['Discovery', 'resource', 'by_uuid', 6848939595]).setDocument({
      data: 'some-data'
    });
    getResource.call(q, args.reference, args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalledWith(false);
  })

});
