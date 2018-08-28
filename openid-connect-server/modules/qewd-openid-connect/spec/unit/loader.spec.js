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

  5 August 2018

*/

'use strict';

const path = require('path');
const mockery = require('mockery');
const Qoper8 = require('../mocks/qoper8');
const express = require('../mocks/express');
const oidcConfig = require('../support/oidc-config');
const { clone, resolveHandlerByUrl } = require('../helpers/utils');

describe('qewd-openid-connect/lib/loader', () => {
  let loader;
  let Provider;
  let initializeAccount;
  let initializeAdapter;
  let logoutSource;

  let q;
  let Account;
  let Adapter;
  let oidc;

  let app;
  let bodyParser;
  let params;

  function initializeProvider() {
    oidc = jasmine.createSpyObj([
      'initialize',
      'callback',
      'interactionDetails',
      'interactionFinished'
    ]);
    oidc.initialize.and.returnValue(Promise.resolve());

    return oidc;
  }

  function registerMocks() {
    oidc = initializeProvider();
    Provider = jasmine.createSpy().and.returnValue(oidc);
    mockery.registerMock('/opt/qewd/node_modules/oidc-provider', Provider);

    Account = jasmine.createSpyObj(['findById', 'authenticate']);
    initializeAccount = jasmine.createSpy().and.returnValue(Account);
    mockery.registerMock('./account', initializeAccount);

    Adapter = jasmine.createSpyObj(['foo']);
    initializeAdapter = jasmine.createSpy().and.returnValue(Adapter);
    mockery.registerMock('./adapter', initializeAdapter);

    logoutSource = jasmine.createSpy();
    mockery.registerMock('./logoutSource', logoutSource);
  }

  async function loaderAsync(q, app, bodyParser, params) {
    return new Promise((resolve) => {
      loader.call(q, app, bodyParser, params);
      setTimeout(resolve, 100);
    });
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
    q = new Qoper8();

    app = express();
    bodyParser = jasmine.createSpyObj(['urlencoded']);
    params = clone(oidcConfig);

    registerMocks();

    loader = require('../../lib/loader');
  });

  afterEach(() => {
    mockery.deregisterAll();
    delete require.cache[require.resolve('../../lib/loader')];
  });

  it('should initialize adapter', () => {
    loader.call(q, app, bodyParser, params);

    expect(initializeAdapter).toHaveBeenCalledWith(q);
  });

  it('should initialize account', () => {
    loader.call(q, app, bodyParser, params);

    expect(initializeAccount).toHaveBeenCalledWith(q);
  });

  it('should initialize oidc provider', () => {
    const issuer = 'http://192.168.0.1:8080/openid';
    const configuration = {
      claims: {
        openid: ['email', 'nhsNumber']
      },
      findById: Account.findById,
      interactionUrl: jasmine.any(Function),
      logoutSource: logoutSource,
      features: {
        devInteractions: false,
        sessionManagement: true
      },
      cookies: {
        keys: ['mySecret1', 'mySecret2', 'mySecret3'],
        thirdPartyCheckUrl: 'https://cdn.rawgit.com/panva/3rdpartycookiecheck/92fead3f/start.html'
      }
    };

    params.keystore = { foo: 'bar' };

    loader.call(q, app, bodyParser, params);

    expect(Provider).toHaveBeenCalledWith(issuer, configuration);
    expect(oidc.initialize).toHaveBeenCalledWith({
      keystore: {
        foo: 'bar'
      },
      adapter: Adapter
    });
  });

  it('should initialize oidc provider with params cookies', () => {
    const issuer = 'http://192.168.0.1:8080/openid';
    const configuration = {
      claims: {
        openid: ['email', 'nhsNumber']
      },
      findById: Account.findById,
      interactionUrl: jasmine.any(Function),
      logoutSource: logoutSource,
      features: {
        devInteractions: false,
        sessionManagement: true
      },
      cookies: {
        keys: ['foo'],
        thirdPartyCheckUrl: 'https://example.org/start.html'
      }
    };

    params.cookies = {
      keys: ['foo'],
      thirdPartyCheckUrl: 'https://example.org/start.html'
    };

    loader.call(q, app, bodyParser, params);

    expect(Provider).toHaveBeenCalledWith(issuer, configuration);
  });

  it('should initialize oidc provider with postLogoutRedirectUri', () => {
    const issuer = 'http://192.168.0.1:8080/openid';
    const configuration = {
      claims: {
        openid: ['email', 'nhsNumber']
      },
      findById: Account.findById,
      interactionUrl: jasmine.any(Function),
      logoutSource: logoutSource,
      features: {
        devInteractions: false,
        sessionManagement: true
      },
      cookies: {
        keys: ['mySecret1', 'mySecret2', 'mySecret3'],
        thirdPartyCheckUrl: 'https://cdn.rawgit.com/panva/3rdpartycookiecheck/92fead3f/start.html'
      },
      postLogoutRedirectUri: jasmine.any(Function)
    };

    params.postLogoutRedirectUri = 'https://example.org';

    loader.call(q, app, bodyParser, params);

    expect(Provider).toHaveBeenCalledWith(issuer, configuration);
  });

  describe('interactionUrl', () => {
    it('should return interaction url', () => {
      const expected = '/interaction/260a7be5-e00f-4b1e-ad58-27d95604d010';

      loader.call(q, app, bodyParser, params);

      const interactionUrl = Provider.calls.allArgs()[0][1].interactionUrl;
      const ctx = {
        oidc: {
          uuid: '260a7be5-e00f-4b1e-ad58-27d95604d010'
        }
      };
      const actual = interactionUrl(ctx);

      expect(actual).toBe(expected);
    });
  });

  describe('postLogoutRedirectUri', () => {
    it('should return post logout redirect uri', async () => {
      params.postLogoutRedirectUri = 'https://example.org';

      loader.call(q, app, bodyParser, params);

      const postLogoutRedirectUri = Provider.calls.allArgs()[0][1].postLogoutRedirectUri;
      const ctx = {};
      const actual = await postLogoutRedirectUri(ctx);

      expect(actual).toBe(params.postLogoutRedirectUri);
    });
  });

  describe('express', () => {
    let req;
    let res;
    let next;

    beforeEach(async () => {
      req = {};
      res = jasmine.createSpyObj(['render']);
      next = jasmine.createSpy();
    });

    it('should configure express settings', async () => {
      await loaderAsync(q, app, bodyParser, params);

      expect(app.set).toHaveBeenCalledTimes(3);
      expect(app.set.calls.argsFor(0)).toEqual(['trust proxy', true]);
      expect(app.set.calls.argsFor(1)).toEqual(['view engine', 'ejs']);
      expect(app.set.calls.argsFor(2)).toEqual(['views', path.resolve(__dirname, '../../lib/views')]);
    });

    describe('GET /interaction/logout', () => {
      it('should initialize GET /interaction/logout route', async () => {
        await loaderAsync(q, app, bodyParser, params);

        expect(app.get).toHaveBeenCalledWith('/interaction/logout', jasmine.any(Function));
      });

      it('should render "logout" view', async () => {
        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.get, '/interaction/logout');
        await fn(req, res, next);

        expect(res.render).toHaveBeenCalledWith('logout');
      });
    });

    describe('GET /interaction/:grant', () => {
      it('should initialize GET /interaction/:grant route', async () => {
        await loaderAsync(q, app, bodyParser, params);

        expect(app.get).toHaveBeenCalledWith('/interaction/:grant', jasmine.any(Function));
      });

      it('should render "interaction" view when "consent_prompt" reason', async () => {
        const details = {
          interaction: {
            reason: 'consent_prompt'
          }
        };
        oidc.interactionDetails.and.returnValue(Promise.resolve(details));

        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.get, '/interaction/:grant');
        await fn(req, res, next);

        expect(oidc.interactionDetails).toHaveBeenCalledWith(req);
        expect(res.render).toHaveBeenCalledWith('interaction', {details});
      });

      it('should render "interaction" view when "client_not_authorized" reason', async () => {
        const details = {
          interaction: {
            reason: 'client_not_authorized'
          }
        };
        oidc.interactionDetails.and.returnValue(Promise.resolve(details));

        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.get, '/interaction/:grant');
        await fn(req, res, next);

        expect(oidc.interactionDetails).toHaveBeenCalledWith(req);
        expect(res.render).toHaveBeenCalledWith('interaction', {details});
      });

      it('should render "login" view when other reason', async () => {
        const details = {
          interaction: {}
        };
        oidc.interactionDetails.and.returnValue(Promise.resolve(details));

        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.get, '/interaction/:grant');
        await fn(req, res, next);

        expect(oidc.interactionDetails).toHaveBeenCalledWith(req);
        expect(res.render).toHaveBeenCalledWith('login', {details});
      });
    });

    describe('POST /interaction/:grant/confirm', () => {
      it('should initialize POST /interaction/:grant/confirm route', async () => {
        const parser = jasmine.createSpy();
        bodyParser.urlencoded.and.returnValue(parser);

        await loaderAsync(q, app, bodyParser, params);

        expect(bodyParser.urlencoded).toHaveBeenCalledWith({ extended: false });
        expect(app.post).toHaveBeenCalledWith('/interaction/:grant/confirm', parser, jasmine.any(Function));
      });

      it('should finished interaction', async () => {
        await loaderAsync(q, app, bodyParser, params);

        const fn = resolveHandlerByUrl(app.post, '/interaction/:grant/confirm');
        fn(req, res, next);

        expect(oidc.interactionFinished).toHaveBeenCalledWith(req, res, {
          consent: {}
        });
      });
    });

    describe('POST /interaction/:grant/login', () => {
      beforeEach(() => {
        req = {
          params: {
            grant: 'GRANT_ID'
          },
          body: {
            username: 'jane.doe@example.org',
            password: '123456',
            remember: ''
          }
        };
      });

      it('should initialize POST /interaction/:grant/login route', async () => {
        const parser = jasmine.createSpy();
        bodyParser.urlencoded.and.returnValue(parser);

        await loaderAsync(q, app, bodyParser, params);

        expect(bodyParser.urlencoded).toHaveBeenCalledWith({ extended: false });
        expect(app.post).toHaveBeenCalledWith('/interaction/:grant/login', parser, jasmine.any(Function));
      });

      it('should call next callback when authenticate rejected', async () => {
        Account.authenticate.and.returnValue(Promise.reject('some error'));

        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.post, '/interaction/:grant/login');

        await fn(req, res, next);

        expect(oidc.interactionFinished).not.toHaveBeenCalled();
        expect(res.render).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith('some error');
      });

      it('should render "login" view with error details when authenticate failed', async () => {
        const account = {
          error: 'some error'
        };
        Account.authenticate.and.returnValue(Promise.resolve(account));

        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.post, '/interaction/:grant/login');
        await fn(req, res, next);

        expect(oidc.interactionFinished).not.toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith('login', {
          details: {
            params: {
              error: 'some error'
            },
            uuid: 'GRANT_ID'
          }
        });
      });

      it('should finished interaction when authenticate success', async () => {
        const account = {
          accountId: 'quux'
        };
        Account.authenticate.and.returnValue(Promise.resolve(account));

        await loaderAsync(q, app, bodyParser, params);
        const fn = resolveHandlerByUrl(app.post, '/interaction/:grant/login');

        jasmine.clock().install();
        const nowTime = Date.UTC(2018, 0, 1); // 151476480000, now
        jasmine.clock().mockDate(new Date(nowTime));

        await fn(req, res, next);

        expect(res.render).not.toHaveBeenCalled();
        expect(oidc.interactionFinished).toHaveBeenCalledWith(req, res, {
          login: {
            account: 'quux',
            acr: '1',
            remember: false,
            ts: 1514764800,
          },
          consent: {}
        });

        jasmine.clock().uninstall();
      });
    });

    describe('/openid', () => {
      it('should initialize /openid route', async () => {
        await loaderAsync(q, app, bodyParser, params);

        expect(app.use).toHaveBeenCalledWith('/openid', jasmine.any(Function), oidc.callback);
      });
    });
  });

  describe('keepAlive', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should start keep alive timer', () => {
      const message = {
        type: 'keepAlive'
      };

      loader.call(q, app, bodyParser, params);

      jasmine.clock().tick(2001 * 1000);

      expect(q.send_promise).toHaveBeenCalledTimes(2);
      expect(q.send_promise.calls.argsFor(0)).toEqual([message]);
      expect(q.send_promise.calls.argsFor(1)).toEqual([message]);
    });

    it('should stop keep alive timer', () => {
      spyOn(q, 'on').and.callThrough();

      loader.call(q, app, bodyParser, params);

      q.emit('stop');
      jasmine.clock().tick(2001 * 1000);

      expect(q.on).toHaveBeenCalledWith('stop', jasmine.any(Function));
      expect(q.send_promise).not.toHaveBeenCalled();
    });
  });
});
