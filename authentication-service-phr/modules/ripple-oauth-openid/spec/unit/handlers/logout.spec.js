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
const Worker = require('../../mocks/worker');
const authConfig = require('../../support/authConfig.json');
const handler = require('../../../lib/handlers/logout');
const { clone } = require('../../helpers/utils');

describe('ripple-oauth-openid/lib/handlers/logout', () => {
  let q;
  let args;
  let finished;

  function httpMock(data) {
    /*jshint camelcase: false */
    nock('https://keycloak.dev1.signin.nhs.uk')
      .get('/cicauth/realms/NHS/protocol/openid-connect/logout')
      .query({id_token_hint: 'TOKEN'})
      .reply(200, data);
    /*jshint camelcase: true */
  }

  beforeEach(() => {
    q = new Worker();
    q.userDefined.auth = clone(authConfig);

    /*jshint camelcase: false */
    args = {
      session: {
        openid: {
          id_token: 'TOKEN'
        }
      }
    };
    /*jshint camelcase: true */

    finished = jasmine.createSpy();
  });

  it('should return non ok response when end_session_endpoint missed', () => {
    /*jshint camelcase: false */
    delete q.userDefined.auth.end_session_endpoint;
    /*jshint camelcase: true */

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      ok: false
    });
  });

  it('should return redirectURL when logout approach is client', () => {
    /*jshint camelcase: false */
    q.userDefined.auth.logout_approach = 'client';
    /*jshint camelcase: true */

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      redirectURL: [
        'https://keycloak.dev1.signin.nhs.uk/cicauth/realms/NHS/protocol/openid-connect/logout',
        '?id_token_hint=TOKEN',
        '&post_logout_redirect_uri=http://example.org'
      ].join('')
    });
  });

  it('should return non ok response when session.openid not set', () => {
    args.session.openid = '';

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      ok: false
    });
  });

  it('should return ok response with redirectURL', (done) => {
    const data = {};
    httpMock(data);

    finished.and.callFake(() => {
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        redirectURL: 'http://example.org'
      });

      done();
    });

    handler.call(q, args, finished);
  });
});
