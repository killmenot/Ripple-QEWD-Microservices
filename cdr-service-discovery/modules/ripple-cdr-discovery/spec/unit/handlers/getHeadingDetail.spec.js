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

describe('ripple-cdr-discovery/lib/handlers/getHeadingDetail', () => {
  let getHeadingDetail;

  let authenticate;
  let getPatientsByNHSNumber;
  let getPatientResources;
  let getSrcHeadingDetail;


  let args;
  let q;
  let finished;
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
      patientId: 9999999000,
      heading: 'vaccinations',
      sourceId: 'Discovery-foo-bar',
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        nhsNumber: 5558526785,
        role: 'phrUser'
      }
    };
    finished = jasmine.createSpy();

    authenticate = jasmine.createSpy();
    mockery.registerMock('../src/authenticate', authenticate);

    getPatientsByNHSNumber = jasmine.createSpy();
    mockery.registerMock('../src/getPatientsByNHSNumber', getPatientsByNHSNumber);

    getPatientResources = jasmine.createSpy();
    mockery.registerMock('../src/getPatientResources', getPatientResources);

    getSrcHeadingDetail = jasmine.createSpy();
    mockery.registerMock('../src/getHeadingDetail', getSrcHeadingDetail);

    delete require.cache[require.resolve('../../../lib/handlers/getHeadingDetail')];
    getHeadingDetail = require('../../../lib/handlers/getHeadingDetail');

    qewdSession = args.req.qewdSession;
  });

  it('should call getHeadingDetail', () => {
    getHeadingDetail.call(q, args, finished)
  });

  it('should call not existing heading', () => {
    args.heading = '';
    getHeadingDetail.call(q, args, finished);
    expect(finished).toHaveBeenCalledWith({
      responseFrom: 'discovery_service',
      results: false
    })
  });

  it('should patientID be not valid ', () => {
    args.patientId = null;
    args.session.role = 'patient';

    getHeadingDetail.call(q, args, finished);
  });

  it('should call getHeadingDetail with not valid sourceID', () => {
      args.sourceId = 'foo-bar';
      getHeadingDetail.call(q, args, finished);
      expect(finished).toHaveBeenCalledWith({
        responseFrom: 'discovery_service',
        results: false
      })
  });

  it('should call authenticate with error', () => {
    authenticate.and.callFake((session, callback) => {
        callback('error')
    });
    getHeadingDetail.call(q, args, finished);
    expect(finished).toHaveBeenCalledWith({
      error: 'error'
    })
  });

  it('should call authenticate with success response and call getPatientsByNHSNumber with error', () => {
    authenticate.and.callFake((session, callback) => {
      callback(null, 'some-jwt-token')
    });
    getPatientsByNHSNumber.and.callFake((patientId, token, session, callback) => callback('error'));
    getHeadingDetail.call(q, args, finished);
    expect(finished).toHaveBeenCalledWith({
      error: 'error'
    })
  });

  it('should call getPatientResources with error', () => {
    authenticate.and.callFake((session, callback) => {
      callback(null, 'some-jwt-token')
    });
    getPatientsByNHSNumber.and.callFake((patientId, token, session, callback) => callback());
    getPatientResources.and.callFake((patientId, resourceRequired, token, session, callback) => callback('error'));
    getHeadingDetail.call(q, args, finished);
    expect(finished).toHaveBeenCalledWith({
      error: 'error'
    })
  });

  it('should call getHeadingDetail from src', () => {
    const response = {
      responseFrom: 'discovery_service',
      results: {
        name: 'Simvastatin',
        doseAmount: '20mg',
        dateCreated: 1497211862000,
        source: 'discovery',
        sourceId: 'discovery-33a93da2-6677-42a0-8b39-9d1e012dde12'
      }
    };
    authenticate.and.callFake((session, callback) => {
      callback(null, 'some-jwt-token')
    });
    getPatientsByNHSNumber.and.callFake((patientId, token, session, callback) => callback());
    getPatientResources.and.callFake((patientId, resourceRequired, token, session, callback) => callback());
    getSrcHeadingDetail.and.returnValue(response.results);
    getHeadingDetail.call(q, args, finished);
    expect(finished).toHaveBeenCalledWith(response)
  })

});
