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

const router = require('qewd-router');
const mockery = require('mockery');
const Worker = require('../mocks/worker');

describe('ripple-cdr-discovery/src/ripple-cdr-discovery', () => {
  let rippleCdrDiscovery;

  let q;

  function getRippleCdrDiscovery() {
    delete require.cache[require.resolve('../../lib/ripple-cdr-discovery')];
    return require('../../lib/ripple-cdr-discovery');
  }

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

    spyOn(router, 'addMicroServiceHandler');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  describe('#init', () => {
    it('GET /api/patients/:patientId/:heading', () => {
      const getHeadingSummary = jasmine.createSpy();
      mockery.registerMock('./handlers/getHeadingSummary', getHeadingSummary);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading': {
          GET: getHeadingSummary
        }
      });
      rippleCdrDiscovery = getRippleCdrDiscovery();
      rippleCdrDiscovery.init.call(q);
      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrDiscovery);
    });
  });
  describe('#beforeMicroServiceHandler', () => {
    let args;
    let finished;

    beforeEach(() => {
      args = {
        session: {
          role: 'admin'
        }
      };
      finished = jasmine.createSpy();

      rippleCdrDiscovery = getRippleCdrDiscovery();
    });

    it('should return true on authorised', () => {
      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrDiscovery.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeTruthy();
    });

    it('should return false on authorised', () => {
      q.jwt.handlers.validateRestRequest.and.returnValue(false);

      const actual = rippleCdrDiscovery.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeFalsy();
    });

  });
});
