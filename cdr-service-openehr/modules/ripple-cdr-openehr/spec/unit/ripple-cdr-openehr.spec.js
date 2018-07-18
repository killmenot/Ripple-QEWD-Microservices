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

  3 July 2018

*/

'use strict';

const router = require('qewd-router');
const Worker = require('../mocks/worker');
const rippleCdrOpenEhr = require('../..');

describe('ripple-cdr-openehr/lib/ripple-cdr-openehr', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    q = new Worker();

    args = {
      session: {
        role: 'admin'
      }
    };
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  describe('#init', () => {
    it('should init microservice handler', () => {
      const routes = {
        '/api/heading/:heading/fields/summary': {
          GET: jasmine.any(Function)
        },
        '/api/my/heading/:heading': {
          GET: jasmine.any(Function),
          POST: jasmine.any(Function)
        },
        '/api/my/heading/:heading/:sourceId': {
          GET: jasmine.any(Function)
        },
        '/api/my/headings/synopsis': {
          GET: jasmine.any(Function)
        },
        '/api/patients/:patientId/headings/synopsis': {
          GET: jasmine.any(Function)
        },
        '/api/patients/:patientId/synopsis/:heading': {
          GET: jasmine.any(Function)
        },
        '/api/patients/:patientId/top3Things': {
          POST: jasmine.any(Function),
          GET: jasmine.any(Function)
        },
        '/api/patients/:patientId/top3Things/:sourceId': {
          PUT: jasmine.any(Function),
          GET: jasmine.any(Function)
        },
        '/api/patients/:patientId/:heading': {
          GET: jasmine.any(Function),
          POST: jasmine.any(Function)
        },
        '/api/patients/:patientId/:heading/:sourceId': {
          GET: jasmine.any(Function),
          PUT: jasmine.any(Function),
          DELETE: jasmine.any(Function)
        },
        '/api/feeds': {
          GET: jasmine.any(Function),
          POST: jasmine.any(Function)
        },
        '/api/feeds/:sourceId': {
          GET: jasmine.any(Function),
          PUT: jasmine.any(Function)
        }
      };

      spyOn(router, 'addMicroServiceHandler');

      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(routes, rippleCdrOpenEhr);
    });
  });

  describe('#beforeMicroServiceHandler', () => {
    it('should return false', () => {
      q.jwt.handlers.validateRestRequest.and.returnValue(false);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeFalsy();
    });

    it('should return unauthorised request error', () => {
      args.path = '/api/my/headings/synopsis';

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(finished).toHaveBeenCalledWith({
        error: 'Unauthorised request'
      });
      expect(actual).toBeFalsy();
    });

    it('should return true when phr user access to /api/my endpoint', () => {
      args.path = '/api/my/headings/synopsis';
      args.session.role = 'phrUser';

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeTruthy();
    });

    it('should return true when access to not /api/my endpoint', () => {
      args.path = '/api/feeds';

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeTruthy();
    });
  });
});
