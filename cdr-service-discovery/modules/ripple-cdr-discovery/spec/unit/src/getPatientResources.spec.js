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

describe('ripple-cdr-discovery/lib/src/getPatientResources', () => {
  let getPatientResources;

  let getPatientBundle;
  let cacheHeadingResources;

  let q;
  let args;
  let qewdSession;
  let callback;


  function httpMock(data, responseCode, responseData) {
    nock('https://deveds.endeavourhealth.net')
    .post('/data-assurance/api/fhir/resources', data)
    .reply(responseCode, responseData);
  }

  function httpMockWithError(data, responseData) {
    nock('https://deveds.endeavourhealth.net')
    .post('/data-assurance/api/fhir/resources', data)
    .replyWithError(500, responseData)
  }

  function seeds() {
    qewdSession.data.$(['Discovery', 'PatientBundle', 'by_nhsNumber', args.nhsNumber, 'Patient']).setDocument([
      {uuid: 1, data: 'some-data-foo'},
      {uuid: 2, data: 'some-data-bar'},
      {uuid: 3, data: 'some-data-foo-bar'},
    ]);
    qewdSession.data.$(['Discovery', 'PatientBundle', 'by_uuid', 1, 'data']).setDocument('some-data-foo');
    qewdSession.data.$(['Discovery', 'PatientBundle', 'by_uuid', 2, 'data']).setDocument('some-data-bar');
    qewdSession.data.$(['Discovery', 'PatientBundle', 'by_uuid', 3, 'data']).setDocument('some-data-foo-bar');
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
      resourceRequired: 'some-resource',
      token: 'some-jwt-token'
    };

    callback = jasmine.createSpy();

    cacheHeadingResources = jasmine.createSpy();
    mockery.registerMock('./cacheHeadingResources', cacheHeadingResources);

    delete require.cache[require.resolve('../../../lib/src/getPatientResources')];
    getPatientResources = require('../../../lib/src/getPatientResources');

    delete require.cache[require.resolve('../../../lib/src/getPatientBundle')];
    getPatientBundle = require('../../../lib/src/getPatientBundle');

    qewdSession = args.session;
  });

  it('should session data does not exist', () => {
      qewdSession.data.$(['Discovery', 'Patient', 'by_nhsNumber', 5558526785, 'resources', args.resourceRequired]).setDocument({
        resourceRequired: 'some-resource'
      });
      getPatientResources.call(q, args.nhsNumber, args.resourceRequired, args.token, qewdSession, callback);
      expect(callback).toHaveBeenCalledWith(false);
  });

  it ('should return call request with error', (done) => {
    const body = {
      resources: [args.resourceRequired],
      patients: {
        resourceType: 'Bundle',
        entry: [
        ]
      }
    };

    httpMockWithError(JSON.stringify(body), {error : 'error'});
    getPatientResources.call(q, args.nhsNumber, args.resourceRequired, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(Error(500));
      done();
    }, 200);
  });

  it('should call cacheHeadingResources', (done) => {
    seeds();
    const body = {
      resources: [args.resourceRequired],
      patients: {}
    };
    body.patients = getPatientBundle.call(q, args.nhsNumber, qewdSession);
    httpMock(JSON.stringify(body), 200, JSON.stringify(
      body.patients
    ));
    cacheHeadingResources.and.callFake((resources, resourceRequired, token, session, callback) => {
      callback();
    });
    getPatientResources.call(q, args.nhsNumber, args.resourceRequired, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(false);
      done();
    }, 200);
  });

  it('shoud return empty entry', (done) => {
    const body = {
      resources: [args.resourceRequired],
      patients: {
        resourceType: 'Bundle',
        entry: [
        ]
      }
    };

    httpMock(JSON.stringify(body), 200, JSON.stringify([]));
    getPatientResources.call(q, args.nhsNumber, args.resourceRequired, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(false);
      done();
    }, 200);
  });

  it('should call cacheHeadingResources with error', (done) => {
    seeds();
    const body = {
      resources: [args.resourceRequired],
      patients: {}
    };
    body.patients = getPatientBundle.call(q, args.nhsNumber, qewdSession);
    httpMock(JSON.stringify(body), 200, JSON.stringify(
      body.patients
    ));
    cacheHeadingResources.and.callFake((resources, resourceRequired, token, session, callback) => {
      callback('error');
    });
    getPatientResources.call(q, args.nhsNumber, args.resourceRequired, args.token, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith('error');
      done();
    }, 200);
  });


});
