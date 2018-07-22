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

const Worker = require('../../mocks/worker');
const handler = require('../../../lib/handlers/login');

describe('ripple-oauth-openid/lib/handlers/login', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    q = new Worker();
    q.auth = {
      getRedirectURL: jasmine.createSpy()
    };

    args = {
      session: {}
    };
    finished = jasmine.createSpy();
  });

  it('should return redirectURL', () => {
    q.auth.getRedirectURL.and.returnValue('http://example.org');

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      redirectURL: 'http://example.org'
    });
  });

  it('should set session authenticated to false', () => {
    handler.call(q, args, finished);

    expect(args.session.authenticated).toBeFalsy();
  });
});
