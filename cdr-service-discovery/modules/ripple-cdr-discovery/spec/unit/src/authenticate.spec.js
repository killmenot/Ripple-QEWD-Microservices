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

const mockery = require('mockery');
const Worker = require('../../mocks/worker');
const nock = require('nock');
var auth_server = require('../../../lib/src/hosts').auth;

describe('ripple-cdr-discovery/lib/src/authenticate', () => {
  let authenticate;

  let q;
  let args;
  let qewdSession;
  let callback;


  function httpMock(data, responseData, responseCode) {
    nock('https://devauth.endeavourhealth.net')
    .post('/auth/realms/endeavour/protocol/openid-connect/token', data)
    .reply(responseCode, responseData);
  }

  function httpMockWithError(data, responseData) {
    nock('https://devauth.endeavourhealth.net')
    .post('/auth/realms/endeavour/protocol/openid-connect/token', data)
    .replyWithError(responseData)
  }

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterEach(() => {
    mockery.deregisterAll();
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();
    args = {
      nhsNumber: 5558526785,
      session: q.sessions.create('app'),
    };

    callback = jasmine.createSpy();

    delete require.cache[require.resolve('../../../lib/src/authenticate')];
    authenticate = require('../../../lib/src/authenticate');

    qewdSession = args.session;
  });

  it('should call authenticate with token', () => {
    qewdSession.data.$(['discoveryToken']).setDocument({
      jwt: 'some-jwt-token',
      createdAt: Date.now() - 40000
    });
    authenticate.call(q, qewdSession, callback);
    expect(callback).toHaveBeenCalledWith(false, 'some-jwt-token')
  });

  it ('should return error authenticate', (done) => {
    var form = {
      client_id:  auth_server.client_id,
      username:   auth_server.username,
      password:   auth_server.password,
      grant_type: auth_server.grant_type,
    };
    httpMockWithError(form, 'custom error');
    authenticate.call(q, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(Error('custom error'));
      done();
    }, 100);
  });

  it('should call request with success response', (done) => {
    var form = {
      client_id:  auth_server.client_id,
      username:   auth_server.username,
      password:   auth_server.password,
      grant_type: auth_server.grant_type,
    };
    httpMock(form, {
      access_token: 'some-jwt-token'
    }, 200);
    authenticate.call(q, qewdSession, callback);
    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith(false, 'some-jwt-token');
      done();
    }, 100);
  })
});
