/*

 ----------------------------------------------------------------------------
 | ripple-oauth-openid: Ripple MicroServices for OAuth OpenId               |
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

  22 July 2018

*/

'use strict';

const jwt = require('jwt-simple');
const handler = require('../../../lib/handlers/getToken');
const Worker = require('../../mocks/worker');
const authMock = require('../../mocks/auth');

describe('ripple-oauth-openid/lib/handlers/getToken', () => {
  let q;
  let args;
  let finished;
  let tokenSet;
  let data;

  beforeEach(() => {
    q = new Worker();
    q.auth = authMock.mock();

    args = {
      req: {},
      session: {}
    };
    finished = jasmine.createSpy();

    data = {
      nhsNumber: 'nhsNumber',
    };

    /*jshint camelcase: false */
    tokenSet = {
      refresh_expires_in: 1200,
      session_state: '0000-000-00-0',
      id_token: jwt.encode(data, 'secret')
    };
    /*jshint camelcase: true */
  });

  it('should return correct response', (done) => {
    q.auth.client.authorizationCallback.and.returnValue(Promise.resolve(tokenSet));

    handler.call(q, args, finished);

    setTimeout(() => {
      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        qewd_redirect: '/index.html',
        cookiePath: '/',
        cookieName: 'JSESSIONID'
      });
      /*jshint camelcase: true */

      done();
    }, 100);
  });

  it('should set session vars', (done) => {
    q.auth.client.authorizationCallback.and.returnValue(Promise.resolve(tokenSet));

    handler.call(q, args, finished);

    setTimeout(() => {
      expect(args.session.authenticated).toBeTruthy();
      expect(args.session.timeout).toBe(1200);
      expect(args.session.nhsNumber).toBe('nhsNumber');
      expect(args.session.role).toBe('phrUser');
      expect(args.session.uid).toBe('0000-000-00-0');

      /*jshint camelcase: false */
      data.id_token = tokenSet.id_token;
      /*jshint camelcase: false */

      expect(args.session.openid).toEqual(data);

      done();
    }, 100);
  });

  it('should return default cookieName', (done) => {
    /*jshint camelcase: false */
    delete q.auth.config.cookie_name;
    /*jshint camelcase: true */

    q.auth.client.authorizationCallback.and.returnValue(Promise.resolve(tokenSet));

    handler.call(q, args, finished);

    setTimeout(() => {
      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        qewd_redirect: '/index.html',
        cookiePath: '/',
        cookieName: 'JSESSIONID'
      });
      /*jshint camelcase: true */

      done();
    }, 100);
  });

  it('should return default cookiePath', (done) => {
    /*jshint camelcase: false */
    q.auth.config.index_url = '';
    /*jshint camelcase: true */

    q.auth.client.authorizationCallback.and.returnValue(Promise.resolve(tokenSet));

    handler.call(q, args, finished);

    setTimeout(() => {
      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        qewd_redirect: '',
        cookiePath: '/',
        cookieName: 'JSESSIONID'
      });
      /*jshint camelcase: true */

      done();
    }, 100);
  });

  it('should return custom cookiePath', (done) => {
    /*jshint camelcase: false */
    q.auth.config.index_url = '/foo/bar/baz.html';
    /*jshint camelcase: true */

    q.auth.client.authorizationCallback.and.returnValue(Promise.resolve(tokenSet));

    handler.call(q, args, finished);

    setTimeout(() => {
      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        qewd_redirect: '/foo/bar/baz.html',
        cookiePath: '/foo/bar',
        cookieName: 'JSESSIONID'
      });
      /*jshint camelcase: true */

      done();
    }, 100);
  });

  it('should handle unhandled rejection', (done) => {
    q.auth.client.authorizationCallback.and.returnValue(Promise.reject('ERROR MSG'));

    handler.call(q, args, finished);

    setTimeout(() => {
      expect(finished).toHaveBeenCalledWith({
        error: 'ERROR MSG'
      });

      done();
    }, 100);
  });
});
