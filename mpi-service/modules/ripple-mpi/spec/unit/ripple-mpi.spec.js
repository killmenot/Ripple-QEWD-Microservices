/*

 ----------------------------------------------------------------------------
 | ripple-admin: Ripple User Administration MicroService                    |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  3 August 2018

*/

'use strict';

const mockery = require('mockery');
const router = require('qewd-router');
const Worker = require('../mocks/worker');

describe('ripple-mpi/lib/ripple-mpi', () => {
  let q;
  let rippleMpi;

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();

    delete require.cache[require.resolve('../../lib/ripple-mpi')];
  });

  describe('init', () => {
    let loadPatients;
    let getDemographics;
    let getPatients;
    let advancedSearch;
    let clinicalSearch;
    let getUser;

    beforeEach(() => {
      spyOn(router, 'addMicroServiceHandler');

      loadPatients = jasmine.createSpy();
      getDemographics = jasmine.createSpy();
      getPatients = jasmine.createSpy();
      advancedSearch = jasmine.createSpy();
      clinicalSearch = jasmine.createSpy();
      getUser = jasmine.createSpy();

      mockery.registerMock('./loadPatients', loadPatients);
      mockery.registerMock('./handlers/getDemographics', getDemographics);
      mockery.registerMock('./handlers/getPatients', getPatients);
      mockery.registerMock('./handlers/getUser', getUser);
      mockery.registerMock('./handlers/advancedSearch', advancedSearch);
      mockery.registerMock('./handlers/clinicalSearch', clinicalSearch);

      rippleMpi = require('../../lib/ripple-mpi');
    });

    it('should init microservice handler', () => {
      const routes = {
        '/api/my/demographics': {
          GET: getDemographics
        },
        '/api/patients': {
          GET: getPatients
        },
        '/api/patients/advancedSearch': {
          POST: advancedSearch
        },
        '/api/patients/querySearch': {
          POST: clinicalSearch
        },
        '/api/demographics/:patientId': {
          GET: getDemographics
        },
        '/api/patients/:patientId': {
          GET: getDemographics
        },
        '/api/user': {
          GET: getUser
        }
      };

      rippleMpi.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(routes, rippleMpi);
    });

    it('should load patients', () => {
      rippleMpi.init.call(q);

      expect(loadPatients).toHaveBeenCalledWithContext(q);
    });
  });

  describe('beforeMicroServiceHandler', () => {
    let args;
    let finished;
    let qewdSession;

    beforeEach(() => {
      rippleMpi = require('../../lib/ripple-mpi');

      args = {
        path: '/api/foo/bar',
        session: {
          role: 'phrUser'
        }
      };
      finished = jasmine.createSpy();

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      qewdSession = q.sessions.create('app');
      q.qewdSessionByJWT.and.returnValue(qewdSession);
    });

    it('should return false', () => {
      q.jwt.handlers.validateRestRequest.and.returnValue(false);

      const actual = rippleMpi.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(q.qewdSessionByJWT).not.toHaveBeenCalled();
      expect(args.qewdSession).toBeUndefined();
      expect(actual).toBeFalsy();
    });

    it('should init QEWD session and return true', () => {
      const actual = rippleMpi.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(q.qewdSessionByJWT).toHaveBeenCalledWithContext(q, args);
      expect(args.qewdSession).toBe(qewdSession);
      expect(actual).toBeTruthy();
    });

    it('should return unauthorised request error when path starts with /api/my and role is non phrUser', () => {
      args.path = '/api/my/demographics';
      args.session.role = 'IDCR';

      const actual = rippleMpi.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(q.qewdSessionByJWT).not.toHaveBeenCalled();
      expect(args.qewdSession).toBeUndefined();
      expect(finished).toHaveBeenCalledWith({
        error: 'Unauthorised request'
      });
      expect(actual).toBeFalsy();
    });

    it('should return unauthorised request error when path starts with /api/patient and role is phrUser', () => {
      args.path = '/api/patient/advancedSearch';

      const actual = rippleMpi.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(q.qewdSessionByJWT).not.toHaveBeenCalled();
      expect(args.qewdSession).toBeUndefined();
      expect(finished).toHaveBeenCalledWith({
        error: 'Unauthorised request'
      });
      expect(actual).toBeFalsy();
    });
  });
});
