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

  3 July 2018

*/

'use strict';

const router = require('qewd-router');
const Worker = require('../mocks/worker');
const rippleConductorIdcr = require('../..');

describe('ripple-conductor-idcr/lib/ripple-conductor-idcr', () => {
  let q;

  beforeEach(() => {
    q = new Worker();
  });

  afterEach(() => {
    q.db.reset();
  });

  describe('restModule', () => {
    it('should be true', () => {
      expect(rippleConductorIdcr.restModule).toBeTruthy();
    });
  });

  describe('#init', () => {
    it('should initialize routes using qewd-router', () => {
      const routes = [
        {
          path: '/api/test',
          method: 'GET',
          handler: jasmine.any(Function)
        },
        {
          path: '/api/application',
          method: 'GET',
          handler: jasmine.any(Function)
        }
      ];

      spyOn(router, 'initialise');

      rippleConductorIdcr.init.call(q);

      expect(router.initialise).toHaveBeenCalledWith(routes, rippleConductorIdcr);
    });
  });

  describe('#beforeMicroServiceHandler', () => {
    it('should be defined', () => {
      const args = {};
      const finished = jasmine.createSpy();

      rippleConductorIdcr.beforeMicroServiceHandler.call(q, args, finished);

      expect(rippleConductorIdcr.beforeMicroServiceHandler).toBeDefined();
    });
  });
});
