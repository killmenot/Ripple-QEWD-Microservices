/*

 ----------------------------------------------------------------------------
 | ripple-auth: Ripple Authentication MicroServices                         |
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

  22 June 2018

*/

'use strict';

const mockery = require('mockery');
const router = require('qewd-router');
const Worker = require('./mocks/worker');
const rippleAuth = require('../..');
const adminLoginHandler = require('../../lib/admin/login');
const adminRegisterHandler = require('../../lib/admin/register');
const adminDocStatusHandler = require('../../lib/admin/docStatus');

describe('ripple-auth/lib/ripple-auth', () => {
  let q;

  beforeAll(() => {
    mockery.enable();
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();
  });

  afterEach(() => {
    mockery.deregisterAll();
  });

  describe('#init', () => {
    let authModule;
    let testHandler;
    let loginHandler;
    let logoutHandler;
    let getTokenHandler;
    let demoHandler;

    beforeEach(() => {
      spyOn(router, 'addMicroServiceHandler');

      authModule = {};
      testHandler = jasmine.createSpy();
      loginHandler = jasmine.createSpy();
      logoutHandler = jasmine.createSpy();
      getTokenHandler = jasmine.createSpy();
      demoHandler = jasmine.createSpy();
    });

    describe('Auth0', () => {
      beforeEach(() => {
        q.userDefined.auth = {
          type: 'Auth0'
        };

        mockery.registerMock('../../ripple-auth0', authModule);
        mockery.registerMock('../../ripple-auth0/lib/handlers/test', testHandler);
        mockery.registerMock('../../ripple-auth0/lib/handlers/login', loginHandler);
        mockery.registerMock('../../ripple-auth0/lib/handlers/logout', logoutHandler);
        mockery.registerMock('../../ripple-auth0/lib/handlers/getToken', getTokenHandler);
        mockery.registerMock('../../ripple-auth0/lib/handlers/demo', demoHandler);
      });

      it('should init microservice handler', () => {
        const routes = {
          '/api/auth/test': {
            'GET': testHandler
          },
          '/api/auth/login': {
            GET: loginHandler
          },
          '/api/auth/logout': {
            GET: logoutHandler
          },
          '/api/auth/token': {
            GET: getTokenHandler
          },
          '/api/auth/admin/login': {
            POST: adminLoginHandler
          },
          '/api/auth/admin/register': {
            POST: adminRegisterHandler
          },
          '/api/auth/admin/docStatus': {
            GET: adminDocStatusHandler
          },
          '/api/auth/demo': {
            GET: demoHandler
          }
        };

        rippleAuth.init.call(q);

        expect(router.addMicroServiceHandler).toHaveBeenCalledWith(routes, rippleAuth);
      });

      it('should init auth module', () => {
        authModule = {
          init: jasmine.createSpy()
        };
        mockery.registerMock('../../ripple-auth0', authModule);

        rippleAuth.init.call(q);

        expect(authModule.init).toHaveBeenCalled();
      });
    });

    describe('OpenID Connect', () => {
      beforeEach(() => {
        q.userDefined.auth = {
          type: 'OpenID Connect'
        };

        mockery.registerMock('../../ripple-oauth-openid', authModule);
        mockery.registerMock('../../ripple-oauth-openid/lib/handlers/test', testHandler);
        mockery.registerMock('../../ripple-oauth-openid/lib/handlers/login', loginHandler);
        mockery.registerMock('../../ripple-oauth-openid/lib/handlers/logout', logoutHandler);
        mockery.registerMock('../../ripple-oauth-openid/lib/handlers/getToken', getTokenHandler);
      });

      it('should init microservice handler', () => {
        const routes = {
          '/api/auth/test': {
            'GET': testHandler
          },
          '/api/auth/login': {
            GET: loginHandler
          },
          '/api/auth/logout': {
            GET: logoutHandler
          },
          '/api/auth/token': {
            GET: getTokenHandler
          },
          '/api/auth/admin/login': {
            POST: adminLoginHandler
          },
          '/api/auth/admin/register': {
            POST: adminRegisterHandler
          },
          '/api/auth/admin/docStatus': {
            GET: adminDocStatusHandler
          }
        };

        rippleAuth.init.call(q);

        expect(router.addMicroServiceHandler).toHaveBeenCalledWith(routes, rippleAuth);
      });

      it('should init auth module', () => {
        authModule = {
          init: jasmine.createSpy()
        };
        mockery.registerMock('../../ripple-oauth-openid', authModule);

        rippleAuth.init.call(q);

        expect(authModule.init).toHaveBeenCalled();
      });
    });

    it('should not init microservice handler', () => {
      rippleAuth.init.call(q);
      expect(router.addMicroServiceHandler).not.toHaveBeenCalled();
    });
  });

  describe('#beforeMicroServiceHandler', () => {
    let finished;

    beforeEach(() => {
      finished = jasmine.createSpy();
    });

    describe('GET /api/auth/admin/docStatus', () => {
      it('should return true', () => {
        const req = {
          path: '/api/auth/admin/docStatus'
        };

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(actual).toBeTruthy();
        expect(finished).not.toHaveBeenCalled();
      });
    });

    describe('GET /api/auth/admin/login', () => {
      it('should return true', () => {
        const req = {
          path: '/api/auth/admin/login'
        };

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(actual).toBeTruthy();
        expect(finished).not.toHaveBeenCalled();
      });
    });

    describe('GET /api/auth/callback', () => {
      it('should validate rest request', () => {
        const req = {
          path: '/api/auth/callback',
          pathTemplate: '/api/auth/callback',
          headers: {},
          token: 'quux'
        };

        const spy = q.jwt.handlers.validateRestRequest.and.returnValue(false);

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(spy).toHaveBeenCalledWithContext(q, req, finished, true, false);
        expect(req.headers.authorization).toBe('Bearer quux');
        expect(actual).toBeFalsy();

      });
    });

    describe('GET /api/auth/token', () => {
      it('should validate rest request', () => {
        const req = {
          path: '/api/auth/token',
          pathTemplate: '/api/auth/token',
          headers: {},
          token: 'quux'
        };

        const spy = q.jwt.handlers.validateRestRequest.and.returnValue(false);

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(spy).toHaveBeenCalledWithContext(q, req, finished, true, false);
        expect(req.headers.authorization).toBe('Bearer quux');
        expect(actual).toBeFalsy();

      });
    });

    describe('GET /api/auth/login', () => {
      it('should return true when no authorization sent', () => {
        const req = {
          path: '/api/auth/login',
          headers: {}
        };

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(actual).toBeTruthy();
      });

       it('should return true when authorization failed', () => {
        const req = {
          path: '/api/auth/login',
          headers: {
            authorization: 'Bearer quux'
          }
        };

        q.jwt.handlers.validateRestRequest.and.returnValue(false);

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(actual).toBeTruthy();
      });

      it('should return authenticate user', () => {
        const req = {
          path: '/api/auth/login',
          headers: {
            authorization: 'Bearer quux'
          }
        };

        q.jwt.handlers.validateRestRequest.and.returnValue(true);

        const actual = rippleAuth.beforeMicroServiceHandler.call(q, req, finished);

        expect(actual).toBeFalsy();
        expect(finished).toHaveBeenCalledWith({
          authenticated: true
        });
      });
    });
  });
});
