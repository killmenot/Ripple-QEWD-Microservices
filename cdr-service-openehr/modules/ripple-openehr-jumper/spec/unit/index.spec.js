/*

 ----------------------------------------------------------------------------
 | ripple-openehr-jumper: Automated OpenEHR Template Access                 |
 |                                                                          |
 | Copyright (c) 2016-18 Ripple Foundation Community Interest Company       |
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

  22 July 2018

*/

'use strict';

const mockery = require('mockery');
const router = require('qewd-router');
const Worker = require('../mocks/worker');

describe('ripple-openehr-jumper/lib/index', () => {
  let rippleOpenEhrJumper;
  let build;
  let getPatientTemplateData;

  let q;

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

    build = jasmine.createSpy();
    mockery.registerMock('./build', build);

    getPatientTemplateData = jasmine.createSpy();
    mockery.registerMock('./getPatientTemplateData', getPatientTemplateData);

    delete require.cache[require.resolve('../../lib')];
    rippleOpenEhrJumper = require('../../lib/');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  describe('#init', () => {
    beforeEach(() => {
      spyOn(router, 'addMicroServiceHandler');
    });

    it('should init micro service handlers', () => {
      rippleOpenEhrJumper.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith({
        '/api/openehr/jumper/build': {
          GET: build
        },
        '/api/openehr/jumper/patient/:patientId/template/:templateName': {
          GET: getPatientTemplateData
        }
      }, rippleOpenEhrJumper);
    });
  });

  describe('#beforeMicroServiceHandler', () => {
    let req;
    let finished;

    beforeEach(() => {
      req = {
        session: {}
      };
      finished = jasmine.createSpy();

      q.jwt.handlers.validateRestRequest.and.returnValue(true);
    });

    it('should return false when not authorized', () => {
      const expected = false;

      q.jwt.handlers.validateRestRequest.and.returnValue(false);

      const actual = rippleOpenEhrJumper.beforeMicroServiceHandler.call(q, req, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, req, finished);
      expect(finished).not.toHaveBeenCalled();
      expect(actual).toBe(expected);
    });

    it('should init qewd session', () => {
      const expected = true;

      const qewdSession = {};
      q.qewdSessionByJWT.and.returnValue(qewdSession);

      const actual = rippleOpenEhrJumper.beforeMicroServiceHandler.call(q, req, finished);

      expect(q.qewdSessionByJWT).toHaveBeenCalledWithContext(q, req);
      expect(req.qewdSession).toBe(qewdSession);
      expect(finished).not.toHaveBeenCalled();
      expect(actual).toBe(expected);
    });

    describe('/api/openehr/jumper/build', () => {
      beforeEach(() => {
        req.path = '/api/openehr/jumper/build';
      });

      it('should return unauthorised error', () => {
        const expected = false;

        const actual = rippleOpenEhrJumper.beforeMicroServiceHandler.call(q, req, finished);

        expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, req, finished);
        expect(finished).toHaveBeenCalledWith({
          error: 'Unauthorised request'
        });
        expect(actual).toBe(expected);
      });

      it('should authorised request for certain userMode', () => {
        const userModes = [
          'admin',
          'primary_startup',
          'openehr_startup'
        ];

        userModes.forEach(userMode => {
          req.session.userMode = userMode;
          finished = jasmine.createSpy();

          const actual = rippleOpenEhrJumper.beforeMicroServiceHandler.call(q, req, finished);

          expect(finished).not.toHaveBeenCalled();
          expect(actual).toBeTruthy();
        });
      });
    });
  });
});
