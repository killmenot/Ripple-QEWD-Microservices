/*

 ----------------------------------------------------------------------------
 | qewd-openid-connect: QEWD-enabled OpenId Connect Server                  |
 |                                                                          |
 | Copyright (c) 2018 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
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

  4 August 2018

*/

'use strict';

const Qoper8 = require('../mocks/qoper8');
const initializeAccount = require('../../lib/account');

describe('qewd-openid-connect/lib/account', () => {
  let q;
  let Account;
  let account;

  let id;
  let userObj;

  function getUserFake(message) {
    return Promise.resolve({
      message: {
        type: message.type,
        email: 'jane.doe@example.org',
        nhsNumber: 9999999003,
        ewd_application: 'quux'
      }
    });
  }

  function validateUserFake(message) {
    if (message.params.email === 'jane.doe@example.org') {
      return Promise.resolve({
        message: {
          email: 'jane.doe@example.org',
          nhsNumber: 9999999003,
          ewd_application: 'quux'
        }
      });
    }

    if (message.params.email === 'john.doe@example.org') {
      return Promise.resolve({
        message: {
          error: 'some error'
        }
      });
    }
  }

  beforeEach(() => {
    q = new Qoper8();

    Account = initializeAccount(q);

    id = 'google-oauth2|11112222333344455556';
    userObj = {
      email: 'john.doe@example.org',
      nhsNumber: 9999999000
    };
  });

  it('should be initialized with correct props', () => {
    account = new Account(id, userObj);

    expect(account.accountId).toBe('google-oauth2|11112222333344455556');
    expect(account._claims).toEqual({
      nhsNumber: 9999999000,
      email: 'john.doe@example.org'
    });
  });

  describe('#claims', () => {
    beforeEach(() => {
      account = new Account(id, userObj);
    });

    it('should return or resolve with an object', () => {
      const expected = {
        sub: 'google-oauth2|11112222333344455556',
        email: 'john.doe@example.org',
        nhsNumber: 9999999000
      };

      const actual = account.claims();

      expect(actual).toEqual(expected);
    });
  });

  describe('findById', () => {
    let ctx;
    let id;

    beforeEach(() => {
      ctx = {};
      id = 'google-oauth2|11112222333344455556';

      q.send_promise.and.callFake(getUserFake);
    });

    it('should return account by id', async () => {
      const response = await Account.findById(ctx, id);

      expect(response).toEqual(jasmine.any(Account));
      expect(response.accountId).toBe('google-oauth2|11112222333344455556');
      expect(response.nhsNumber).toBe(9999999003);
      expect(response.email).toBe('jane.doe@example.org');
    });
  });

  // describe('authenticate', () => {
  //   let email;
  //   let password;

  //   beforeEach(() => {
  //     email = 'jane.doe@example.org';
  //     password = 'test1234';

  //     q.send_promise.and.callFake(validateUserFake);
  //   });

  //   it('should return email must be provided error', async () => {
  //     email = '';

  //     const response = await Account.authenticate(email, password);

  //     expect(response).toEqual({
  //       error: 'Email must be provided'
  //     });
  //   });

  //   it('should return password must be provided error', async () => {
  //     password = '';

  //     const response = await Account.authenticate(email, password);

  //     expect(response).toEqual({
  //       error: 'Password must be provided'
  //     });
  //   });

  //   it('should return custom error', async () => {
  //     email = 'john.doe@example.org';

  //     const response = await Account.authenticate(email, password);

  //     expect(response).toEqual({
  //       error: 'some error'
  //     });
  //   });

  //   it('should return account by credentials', async () => {
  //     const response = await Account.authenticate(email, password);

  //     expect(response).toEqual(jasmine.any(Account));
  //     expect(response.accountId).toBe('jane.doe@example.org');
  //     expect(response.nhsNumber).toBe(9999999003);
  //     expect(response.email).toBe('jane.doe@example.org');
  //   });
  // });
});
