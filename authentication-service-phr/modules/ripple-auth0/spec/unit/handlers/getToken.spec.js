/*

 ----------------------------------------------------------------------------
 | ripple-auth0: Ripple MicroServices for Auth0                             |
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

  22 July 2018

*/

'use strict';

const nock = require('nock');
const jwt = require('jwt-simple');
const Worker = require('../../mocks/worker');
const authConfig = require('../../support/authConfig.json');
const { clone } = require('../../helpers/utils');
const handler = require('../../../lib/handlers/getToken');

describe('ripple-auth0/lib/handlers/getToken', () => {
  let q;
  let args;
  let data;
  let finished;

  function httpMock(data) {
    /*jshint camelcase: false */
    nock('https://xxx.eu.auth0.com')
      .post('/oauth/token', {
        grant_type: 'authorization_code',
        client_id: 'xxxxxxxxxxxxxxxx',
        client_secret: 'yyyyyyyyyyyyyyyyyyyyyyyyyyy',
        code: 'CODE',
        redirect_uri: 'http://www.example.org/api/auth/token'
      })
      .reply(200, {
        id_token: jwt.encode(data, 'secret')
      });
    /*jshint camelcase: true */
  }

  beforeEach(() => {
    q = new Worker();
    q.userDefined.auth = clone(authConfig);

    /*jshint camelcase: false */
    data = {
      nhs_number: 'nhsNumber'
    };
    /*jshint camelcase: true */

    args = {
      session: {},
      req: {
        query: {
          code: 'CODE'
        }
      }
    };
    finished = jasmine.createSpy();
  });

  it('should return correct response', (done) => {
    httpMock(data);

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

  it('should return default cookieName', (done) => {
    /*jshint camelcase: false */
    delete q.userDefined.auth.cookie_name;
    /*jshint camelcase: true */

    httpMock(data);

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
    q.userDefined.auth.index_url = '';
    /*jshint camelcase: true */

    httpMock(data);

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
    q.userDefined.auth.index_url = '/foo/bar/baz.html';
    /*jshint camelcase: true */

    httpMock(data);

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

  it('should set session vars', (done) => {
    httpMock(data);

    handler.call(q, args, finished);

    setTimeout(() => {
      expect(args.session.timeout).toBe(1200);
      expect(args.session.nhsNumber).toBe('nhsNumber');
      expect(args.session.role).toBe('IDCR');
      expect(args.session.uid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
      expect(args.session.auth0).toEqual(data);

      done();
    }, 100);
  });

  it('should set session role to phrUser', (done) => {
    /*jshint camelcase: false */
    data = {
      nhs_number: 'nhsNumber',
      role: 'PHR'
    };
    /*jshint camelcase: true */

    httpMock(data);

    handler.call(q, args, finished);

    setTimeout(() => {
      expect(args.session.role).toBe('phrUser');
      expect(args.session.auth0).toEqual(data);

      done();
    }, 100);
  });
});
