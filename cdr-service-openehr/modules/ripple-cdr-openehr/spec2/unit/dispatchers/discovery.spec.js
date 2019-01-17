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

  30 December 2018

*/

'use strict';

const { MasterMock } = require('../../mocks');
const DiscoveryDispatcher = require('../../../lib2/dispatchers/discovery');

describe('ripple-cdr-openehr/lib/dispatchers/discovery', () => {
  let q;
  let discoveryDispatcher;

  beforeEach(() => {
    q = new MasterMock();
    discoveryDispatcher = new DiscoveryDispatcher(q);
  });

  describe('#getDiscoveryData', () => {
    it('should return data when heading is finished', async () => {
      const expected = {
        message: {
          status: 'complete',
          results: []
        }
      };

      const patientId = 9999999000;
      const heading = 'finished';
      const jwt = 'foo.bar.baz';

      const actual = await discoveryDispatcher.getDiscoveryData(patientId, heading, jwt);

      expect(actual).toEqual(expected);
    });

    it('should return response message from the microservice', async () => {
      const expected = {
        foo: 'bar'
      };

      q.microServiceRouter.and.callFake((message, cb) => {
        const responseObj = {
          message: {
            foo: 'bar'
          }
        };
        cb(responseObj);
      });

      const patientId = 9999999000;
      const heading = 'problems';
      const jwt = 'foo.bar.baz';

      const actual = await discoveryDispatcher.getDiscoveryData(patientId, heading, jwt);

      expect(q.microServiceRouter).toHaveBeenCalledWithContext(
        q,
        {
          path: '/api/discovery/9999999000/problems',
          method: 'GET',
          headers: {
            authorization: 'Bearer foo.bar.baz'
          }
        },
        jasmine.any(Function)
      );
      expect(actual).toEqual(expected);
    });

    it('should throw error when microservice reutrn error in response', async () => {
      const expected = {
        error: 'custom error'
      };

      q.microServiceRouter.and.callFake((message, cb) => {
        const responseObj = {
          error: 'custom error'
        };
        cb(responseObj);
      });

      const patientId = 9999999000;
      const heading = 'problems';
      const jwt = 'foo.bar.baz';

      try {
        await discoveryDispatcher.getDiscoveryData(patientId, heading, jwt);
      } catch (err) {
        expect(err).toEqual(expected);
      }
    });
  });

  describe('#mergeDiscoveryData', () => {
    beforeEach(() => {
      q.jwt.handlers.getProperty.and.returnValue('quuz');
    });

    it('should merge response message from microservice', async () => {
      const expected = {
        foo: 'bar'
      };

      q.handleMessage.and.callFake((message, cb) => {
        const responseObj = {
          message: {
            foo: 'bar'
          }
        };
        cb(responseObj);
      });

      const heading = 'problems';
      const data = {
        baz: 'quux'
      };
      const jwt = 'foo.bar.baz';

      const actual = await discoveryDispatcher.mergeDiscoveryData(heading, data, jwt);

      expect(q.jwt.handlers.getProperty).toHaveBeenCalledWith('uid', 'foo.bar.baz');
      expect(q.handleMessage).toHaveBeenCalledWithContext(
        q,
        {
          application: 'ripple-cdr-openehr',
          type: 'restRequest',
          path: '/discovery/merge/problems',
          pathTemplate: '/discovery/merge/:heading',
          method: 'GET',
          headers: {
            authorization: 'Bearer foo.bar.baz'
          },
          args: {
            heading: 'problems'
          },
          data: {
            baz: 'quux'
          },
          token: 'quuz'
        },
        jasmine.any(Function)
      );
      expect(actual).toEqual(expected);
    });

    it('should merge response message from microservice', async () => {
      const expected = {
        error: 'custom error'
      };

      q.handleMessage.and.callFake((message, cb) => {
        const responseObj = {
          error: 'custom error'
        };
        cb(responseObj);
      });

      const heading = 'problems';
      const data = {
        baz: 'quux'
      };
      const jwt = 'foo.bar.baz';

      try {
        await discoveryDispatcher.mergeDiscoveryData(heading, data, jwt);
      } catch (err) {
        expect(err).toEqual(expected);
      }
    });
  });

  describe('#sync', () => {
    beforeEach(() => {
      const data = { foo: 'bar' };
      spyOn(discoveryDispatcher, 'getDiscoveryData').and.resolveValue(data);
      spyOn(discoveryDispatcher, 'mergeDiscoveryData');
    });

    it('should sync a single heading', async () => {
      const patientId = 9999999000;
      const heading = 'problems';
      const jwt = 'foo.bar.baz';

      await discoveryDispatcher.sync(patientId, heading, jwt);

      expect(discoveryDispatcher.getDiscoveryData).toHaveBeenCalledWith(9999999000, 'problems', 'foo.bar.baz');
      expect(discoveryDispatcher.mergeDiscoveryData).toHaveBeenCalledWith('problems', { foo: 'bar' }, 'foo.bar.baz');
    });

    it('should ignore errors', async () => {
      discoveryDispatcher.mergeDiscoveryData.and.rejectValue(new Error('custom error'));

      const patientId = 9999999000;
      const heading = 'problems';
      const jwt = 'foo.bar.baz';

      await discoveryDispatcher.sync(patientId, heading, jwt);

      expect(discoveryDispatcher.getDiscoveryData).toHaveBeenCalledWith(9999999000, 'problems', 'foo.bar.baz');
      expect(discoveryDispatcher.mergeDiscoveryData).toHaveBeenCalledWith('problems', { foo: 'bar' }, 'foo.bar.baz');
    });
  });

  describe('#syncAll', () => {
    it('should sync multiple headings', async () => {
      spyOn(discoveryDispatcher, 'sync').and.resolveValue();

      const patientId = 9999999000;
      const headings = ['problems', 'vaccinations'];
      const jwt = 'foo.bar.baz';

      await discoveryDispatcher.syncAll(patientId, headings, jwt);

      expect(discoveryDispatcher.sync).toHaveBeenCalledTimes(2);
      expect(discoveryDispatcher.sync).toHaveBeenCalledWith(9999999000, 'problems', 'foo.bar.baz');
      expect(discoveryDispatcher.sync).toHaveBeenCalledWith(9999999000, 'vaccinations', 'foo.bar.baz');
    });
  });
});
