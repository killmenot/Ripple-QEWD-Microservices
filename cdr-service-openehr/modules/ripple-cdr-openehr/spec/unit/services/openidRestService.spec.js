/*

 ----------------------------------------------------------------------------
 | ripple-cdr-openehr: Ripple MicroServices for OpenEHR                     |
 |                                                                          |
 | Copyright (c) 2018-19 Ripple Foundation Community Interest Company       |
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

  7 February 2019

*/

'use strict';

const nock = require('nock');
const { ExecutionContextMock } = require('../../mocks');
const config = require('../../../lib/config');
const OpenidRestService = require('../../../lib/services/openidRestService');

describe('ripple-cdr-openehr/lib/services/openidRestService', () => {
  let ctx;
  let hostConfig;

  let openidRestService;

  beforeEach(() => {
    ctx = new ExecutionContextMock();
    hostConfig = {
      url: 'https://178.128.40.14',
      path: '/oidc',
      strictSSL: false
    };

    openidRestService = new OpenidRestService(ctx, hostConfig);

    ctx.freeze();
  });

  describe('#create (static)', () => {
    it('should initialize a new instance', async () => {
      const actual = OpenidRestService.create(ctx);

      expect(actual).toEqual(jasmine.any(OpenidRestService));
      expect(actual.ctx).toBe(ctx);
      expect(actual.hostConfig).toEqual(config.oidc);
    });
  });

  describe('#getTokenIntrospection', () => {
    it('should return token introspection', async () => {
      const expected = {
        active: true
      };

      nock('https://178.128.40.14')
        .post('/oidc/token/introspection', {
          token: 'quux'
        })
        .matchHeader('authorization', 'Basic 123456')
        .reply(200, '{"active": true}');

      const token = 'quux';
      const credentials = '123456';
      const actual = await openidRestService.getTokenIntrospection(token, credentials);

      expect(nock).toHaveBeenDone();
      expect(actual).toEqual(expected);
    });

    it('should return empty result', async () => {
      const expected = {};

      nock('https://178.128.40.14')
        .post('/oidc/token/introspection', {
          token: 'quux'
        })
        .matchHeader('authorization', 'Basic 123456')
        .reply(200, '');

      const token = 'quux';
      const credentials = '123456';
      const actual = await openidRestService.getTokenIntrospection(token, credentials);

      expect(nock).toHaveBeenDone();
      expect(actual).toEqual(expected);
    });
  });
});
