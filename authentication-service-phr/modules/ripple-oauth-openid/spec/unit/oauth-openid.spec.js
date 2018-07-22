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

const nock = require('nock');
const rewire = require('rewire');
const Worker = require('../mocks/worker');
const openidClientMock = require('../mocks/openid-client');
const authConfig = require('../support/authConfig.json');
const { __revert__, clone } = require('../helpers/utils');

describe('ripple-oauth-openid/lib/oauth-openid', () => {
  let oAuthOpenid;
  let q;
  let openidClient;
  let clientSpy;
  let issuer;

  function httpMock() {
    /*jshint camelcase: false */
    nock('https://keycloak.dev1.signin.nhs.uk')
      .get('/cicauth/realms/NHS')
      .reply(200, {
        public_key: 'CONTENT'
      });
    /*jshint camelcase: true */
  }

  beforeEach(() => {
    q = new Worker();
    q.userDefined.auth = clone(authConfig);

    clientSpy = jasmine.createSpy();
    issuer = {
      Client: clientSpy
    };

    openidClient = openidClientMock.mock();
    openidClient.Issuer.and.returnValue(issuer);

    oAuthOpenid = rewire('../../lib/oauth-openid');
    openidClient.__revert__ = oAuthOpenid.__set__('Issuer', openidClient.Issuer);

    httpMock();
  });

  afterEach(() => {
    __revert__(openidClient);

    delete require.cache[require.resolve('../../lib/oauth-openid')];
  });

  describe('#init', () => {
    it('should init auth.config', (done) => {
      oAuthOpenid.init.call(q);

      setTimeout(() => {
        expect(q.auth.config).toBe(q.userDefined.auth);
        done();
      }, 100);
    });

    it('should init auth.publicKey', (done) => {
      oAuthOpenid.init.call(q);

      setTimeout(() => {
        expect(q.auth.publicKey).toBe('-----BEGIN PUBLIC KEY-----\nCONTENT\n-----END PUBLIC KEY-----');
        done();
      }, 100);
    });

    it('should init auth.issuer', (done) => {
      oAuthOpenid.init.call(q);

      setTimeout(() => {
        /*jshint camelcase: false */
        expect(openidClient.Issuer).toHaveBeenCalledWith({
          issuer: 'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS',
          authorization_endpoint: 'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS/protocol/openid-connect/auth',
          token_endpoint: 'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS/protocol/openid-connect/token',
          userinfo_endpoint: 'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS/protocol/openid-connect/userinfo',
          introspection_endpoint: 'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS/protocol/openid-connect/token/introspect',
          jwks_uri: 'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS/protocol/openid-connect/certs'
        });
        /*jshint camelcase: true */

        expect(q.auth.issuer).toBe(issuer);
        done();
      }, 100);
    });

    it('should init auth.client', (done) => {
      const client = {};
      clientSpy.and.returnValue(client);

      oAuthOpenid.init.call(q);

      setTimeout(() => {
        /*jshint camelcase: false */
        expect(clientSpy).toHaveBeenCalledWith({
          client_id: 's6BhdRkqt3',
          client_secret: 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
        });
        /*jshint camelcase: true */

        expect(q.auth.client).toBe(client);
        done();
      }, 100);
    });

    it('should init auth.getRedirectURL', (done) => {
      oAuthOpenid.init.call(q);

      setTimeout(() => {
        expect(q.auth.getRedirectURL).toEqual(jasmine.any(Function));
        done();
      }, 100);
    });

    it('should not be initialized twice', (done) => {
      oAuthOpenid.init.call(q);
      oAuthOpenid.init.call(q);

      setTimeout(() => {
        expect(openidClient.Issuer).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });
  });

  describe('#auth.getRedirectURL', () => {
    it('should return correct url', (done) => {
      const expected = 'AUTHORIZATION_URL';

      const client = {
        authorizationUrl: jasmine.createSpy().and.returnValue('AUTHORIZATION_URL')
      };
      clientSpy.and.returnValue(client);

      oAuthOpenid.init.call(q);

      setTimeout(() => {
        const scope = ['scope'];

        const actual = q.auth.getRedirectURL(scope);

        /*jshint camelcase: false */
        expect(client.authorizationUrl).toHaveBeenCalledWith({
          redirect_uri: 'http://example.org/api/auth/token',
          scope: ['scope'],
        });
        /*jshint camelcase: true */

        expect(actual).toBe(expected);
        done();
      }, 100);
    });
  });
});
