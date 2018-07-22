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
    nock('https://blue.testlab.nhs.uk')
      .get('/auth/realms/sandpit/protocol/openid-connect/logout')
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

  it('should return non ok response when session.openid missed', () => {
    delete args.session.openid;

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      ok: false
    });
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

  it('should return ok response', (done) => {
    const data = {
      foo: 'bar'
    };
    httpMock(data);

    finished.and.callFake(() => {
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        body: {
          foo: 'bar'
        }
      });

      done();
    });

    handler.call(q, args, finished);
  });
});
