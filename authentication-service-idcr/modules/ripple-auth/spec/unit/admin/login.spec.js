/*

 ----------------------------------------------------------------------------
 | ripple-auth: Ripple Authentication MicroServices                         |
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

  22 June 2018

*/

'use strict';

const Worker = require('../../mocks/worker');
const handler = require('../../../lib/admin/login');

describe('ripple-auth/lib/admin/login', () => {
  let q;
  let args;
  let finished;

  const config = {
    managementPassword: 'pa$$word'
  };
  const user = {
    email: 'john.doe@example.org',
    givenName: 'John',
    familyName: 'Doe',
    type: 'idcr',
    password: '$2b$10$aUj5X6rcQUapwkr31V1SoeD.Da6.VO/GYF7dOEu1opJcdIn2/gi0e'
  };

  beforeEach(() => {
    q = new Worker(config);

    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    rippleAdmin.$(['byUsername', 'john']).value = 4;
    rippleAdmin.$(['byId', 4]).setDocument(user);

    args = {
      req: {
        body: {
          username: 'john',
          password: 'pa$$word'
        }
      },
      session: {}
    };

    spyOn(q.db, 'use').and.callThrough();
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return invalid login attempt when no body sent', () => {
    delete args.req.body;

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid login attempt'
    });
  });

  describe('When admin document does not exist', () => {
    beforeEach(() => {
      q.db.reset();
    });

    it('should return invalid login attempt when password does not equal management password', () => {
      args.req.body.password = 'something';

      handler.call(q, args, finished);

      expect(q.db.use).toHaveBeenCalledWith('RippleAdmin');
      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid login attempt'
      });
    });

    it('should allow login when using QEWD Management Password', () => {
      handler.call(q, args, finished);

      expect(q.db.use).toHaveBeenCalledWith('RippleAdmin');
      expect(args.session.authenticated).toBeTruthy();
      expect(args.session.userMode).toBe('addAdminUser');
      expect(finished).toHaveBeenCalledWith({
        ok: true,
        mode: 'addAdminUser'
      });
    });
  });

  describe('When username is mailformed', () => {
    it('should return missed username error when not string', () => {
      args.req.body = {};

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a username'
      });
    });

    it('should return missed username error when empty', () => {
      args.req.body = {
        username: ''
      };

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a username'
      });
    });
  });

  describe('When password is mailformed', () => {
    it('should return missed password error when not string', () => {
      delete args.req.body.password;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a password'
      });
    });

    it('should return missed password error when empty', () => {
      args.req.body.password = '';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a password'
      });
    });
  });

  describe('When username does not exist', () => {
    beforeEach(() => {
      args.req.body.username = 'quux';
    });

    it('should return invalid login attempt', () => {
      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid login attempt'
      });
    });
  });

  describe('When password mismatch', () => {
    beforeEach(() => {
      args.req.body.password = 'quux';
    });

    it('should return invalid login attempt', () => {
      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid login attempt'
      });
    });
  });

  it('should authenticate user', () => {
    args.session = {
      auth0: 'auth0',
      nhsNumber: '9999999000'
    };

    handler.call(q, args, finished);

    expect(args.session.userMode).toBe('idcr');
    /*jshint camelcase: false */
    expect(args.session.given_name).toBe('John');
    expect(args.session.family_name).toBe('Doe');
    /*jshint camelcase: true */
    expect(args.session.email).toBe('john.doe@example.org');
    expect(args.session.role).toBe('IDCR');
    expect(args.session.roles).toEqual(['IDCR']);
    expect(args.session.uid).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    expect(args.session.authenticated).toBeTruthy();
    expect(args.session.auth0).toBeUndefined();
    expect(args.session.nhsNumber).toBeUndefined();
    expect(finished).toHaveBeenCalledWith({
      ok: true,
      mode: 'idcr'
    });
  });
});
