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

const mockery = require('mockery');
const Qoper8 = require('../mocks/qoper8');
const express = require('../mocks/express');
const config = require('../support/config');
const documents = require('../support/documents.json');

describe('qewd-openid-connect/lib/qewd-openid-connect', () => {
  let oidcServer;
  let qewdInterface;
  let load;
  let q;

  let app;
  let bodyParser;
  let params;

  function handleMessageFake(message) {
    if (message.type === 'ewd-register') {
      return Promise.resolve({
        message: {
          token: 'this is a token'
        }
      });
    }

    if (message.type === 'login') {
      return Promise.resolve();
    }

    if (message.type === 'getParams') {
      return Promise.resolve({
        message: {
          param1: 'baz',
          param2: 'quux'
        }
      });
    }
  }

  function registerMocks(documents) {
    if (documents) {
      mockery.registerMock('/opt/qewd/mapped/documents.json', documents);
    }

    qewdInterface = jasmine.createSpy();
    mockery.registerMock('./qewd_interface', qewdInterface);

    load = jasmine.createSpy();
    mockery.registerMock('./loader', load);
  }

  function clean() {
    mockery.deregisterAll();
    delete require.cache[require.resolve('../../lib/qewd-openid-connect')];
  }

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Qoper8(config);
    q.send_promise.and.callFake(handleMessageFake);

    app = express();
    bodyParser = jasmine.createSpyObj(['urlencoded']);
    params = { foo: 'bar' };

    registerMocks();
    oidcServer = require('../../lib/qewd-openid-connect');
  });

  afterEach(() => {
    clean();
  });

  it('should init QEWD interace', (done) => {
    oidcServer.call(q, app, bodyParser, params);

    setTimeout(() => {
      expect(qewdInterface).toHaveBeenCalledWithContext(q);

      done();
    }, 100);
  });

  it('should register qewd-openid-connect application', (done) => {
    oidcServer.call(q, app, bodyParser, params);

    setTimeout(() => {
      expect(q.openid_server.token).toBe('this is a token');
      expect(q.send_promise.calls.argsFor(0)[0]).toEqual({
        type: 'ewd-register',
        application: 'qewd-openid-connect'
      });

      done();
    }, 100);
  });

  it('should obtain token via login', (done) => {
    oidcServer.call(q, app, bodyParser, params);

    setTimeout(() => {
      expect(q.send_promise.calls.argsFor(1)[0]).toEqual({
        type: 'login',
        params: {
          password: '123456'
        }
      });

      done();
    }, 100);
  });

  it('should fetch or generate the keystore and config params', (done) => {
    oidcServer.call(q, app, bodyParser, params);

    setTimeout(() => {
      expect(q.send_promise.calls.argsFor(2)[0]).toEqual({
        type: 'getParams'
      });

      done();
    }, 100);
  });

  it('should fetch or generate the keystore and config params when documents are loaded', (done) => {
    clean();
    registerMocks(documents);
    oidcServer = require('../../lib/qewd-openid-connect');

    oidcServer.call(q, app, bodyParser, params);

    setTimeout(() => {
      expect(q.send_promise.calls.argsFor(2)[0]).toEqual({
        type: 'getParams',
        params: {
          documents: documents,
          documentsPath: '/opt/qewd/mapped/documents.json'
        }
      });

      done();
    }, 100);
  });

  it('should start up the OpenID connect server', (done) => {
    oidcServer.call(q, app, bodyParser, params);

    setTimeout(() => {
      expect(load).toHaveBeenCalledWithContext(q, app, bodyParser, params);
      expect(params).toEqual({
        foo: 'bar',
        param1: 'baz',
        param2: 'quux'
      });

      done();
    }, 100);
  });
});
