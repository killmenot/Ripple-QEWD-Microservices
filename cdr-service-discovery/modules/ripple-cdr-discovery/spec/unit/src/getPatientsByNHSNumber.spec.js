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

describe('ripple-cdr-discovery/lib/src/getPatientsByNHSNumber', () => {
  let getPatientsByNHSNumber;

  let cachePatientResource;

  let q;
  let args;
  let qewdSession;
  let callback;


  function httpMock(responseCode, responseData) {
    nock('https://deveds.endeavourhealth.net/data-assurance')
    .get('/api/fhir/patients?nhsNumber=5558526785')
    .reply(responseCode, responseData);
  }

  function httpMockWithError(responseData) {
    nock('https://deveds.endeavourhealth.net/data-assurance')
    .get('/api/fhir/patients?nhsNumber=5558526785')
    .replyWithError(500, responseData)
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
      token: 'some-jwt-token',
      session: q.sessions.create('app'),
    };

    callback = jasmine.createSpy();

    cachePatientResource = jasmine.createSpy();
    mockery.registerMock('./cachePatientResource', cachePatientResource);

    delete require.cache[require.resolve('../../../lib/src/getPatientsByNHSNumber')];
    getPatientsByNHSNumber = require('../../../lib/src/getPatientsByNHSNumber');

    qewdSession = args.session;
  });

  it('should call getPatientsByNHSNumber', () => {
    getPatientsByNHSNumber.call(q, args.nhsNumber, args.token, qewdSession, callback);
  });

  it('should call getPatientsByNHSNumber without session', () => {
    qewdSession.data.$(['Discovery', 'Patient','by_nhsNumber', args.nhsNumber]).setDocument('some-data');
    getPatientsByNHSNumber.call(q, args.nhsNumber, args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalledWith(false)
  });

  it ('should call request with  500 response code', (done) => {
    httpMock(500, 'Server Problems');
    getPatientsByNHSNumber.call(q, args.nhsNumber, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({error : 'Discovery Server Problem: Server Problems'});
      done();
    }, 100);
  });

  it ('should call request with success response', (done) => {
    httpMock(200, JSON.stringify({
      response: {
        data : 'some-data'
      }
    }));
    cachePatientResource.and.returnValue({});
    getPatientsByNHSNumber.call(q, args.nhsNumber, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(false);
      done();
    }, 100);
  });

  it ('should call request with not json body', (done) => {
    httpMock(200, 'some-data');
    getPatientsByNHSNumber.call(q, args.nhsNumber, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      done();
    }, 100);
  });

});
