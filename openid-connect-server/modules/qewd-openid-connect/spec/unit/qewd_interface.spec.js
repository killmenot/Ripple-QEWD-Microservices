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

const qewdInterface = require('../../lib/qewd_interface');

describe('qewd-openid-connect/lib/qewd_interface', () => {
  let Qoper8;
  let q;

  function handleMessageFake(message, callback) {
    callback({
      type: message.type,
      token: message.token || null,
      responseObj: true
    });
  }

  beforeAll(() => {
    Qoper8 = function () {
      this.handleMessage = jasmine.createSpy().and.callFake(handleMessageFake);
    };
  });

  beforeEach(() => {
    q = new Qoper8();
  });

  describe('openid_server', () => {
    it('should initialize "openid_server" prop', (done) => {
      const expected = {};

      qewdInterface.call(q);

      setTimeout(() => {
        expect(q.openid_server).toEqual(expected);

        done();
      }, 100);
    });
  });

  describe('send_promise', () => {
    beforeEach(() => {
      qewdInterface.call(q);
    });

    it('should handle message and return response', (done) => {
      const message = { type: 'foo'};

      q.send_promise(message).then((responseObj) => {
        expect(q.handleMessage).toHaveBeenCalledWith(message, jasmine.any(Function));
        expect(responseObj).toEqual({
          type: 'foo',
          token: null,
          responseObj: true
        });

        done();
      });
    });

    it('should handle message and return response when token is defined', (done) => {
      const message = { type: 'foo'};

      q.openid_server.token = 'this is a token';
      q.send_promise(message).then((responseObj) => {
        expect(q.handleMessage).toHaveBeenCalledWith(message, jasmine.any(Function));
        expect(responseObj).toEqual({
          type: 'foo',
          token: 'this is a token',
          responseObj: true
        });

        done();
      });
    });
  });
});
