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

const Worker = require('../../mocks/worker');
const authConfig = require('../../support/authConfig.json');
const { clone } = require('../../helpers/utils');
const handler = require('../../../lib/handlers/login');

describe('ripple-auth0/lib/handlers/login', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    q = new Worker();
    q.userDefined.auth = clone(authConfig);

    args = {
      req: {
        query: {}
      },
      session: {}
    };
    finished = jasmine.createSpy();
  });

  it('should return correct response', () => {
    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      redirectURL: 'https://xxx.eu.auth0.com/authorize?scope=openid profile email&response_type=code&connections[0]=Username-Password-Authentication&connections[1]=google-oauth2&connections[2]=twitter&sso=true&client_id=xxxxxxxxxxxxxxxx&redirect_uri=http://www.example.org/api/auth/token&auth0Client=eyJuYW1lIjoicWV3ZC1jbGllbnQiLCJ2ZXJzaW9uIjoiMS4yNi4wIn0='
    });
  });

  it('should set session authenticated to false', () => {
    handler.call(q, args, finished);

    expect(args.session.authenticated).toBeFalsy();
  });

  it('should return correct response when no connections defined', () => {
    delete q.userDefined.auth.connections;

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      redirectURL: 'https://xxx.eu.auth0.com/authorize?scope=openid profile email&response_type=code&sso=true&client_id=xxxxxxxxxxxxxxxx&redirect_uri=http://www.example.org/api/auth/token&auth0Client=eyJuYW1lIjoicWV3ZC1jbGllbnQiLCJ2ZXJzaW9uIjoiMS4yNi4wIn0='
    });
  });
});
