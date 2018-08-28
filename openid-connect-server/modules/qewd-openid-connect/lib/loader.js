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

  4 July 2018

*/

'use strict';

const Provider = require('/opt/qewd/node_modules/oidc-provider');
const account = require('./account');
const adapter = require('./adapter');
const logoutSource = require('./logoutSource');
const debug = require('debug')('qewd-openid-connect:loader');
const path = require('path');
const util = require('util');

module.exports = function(app, bodyParser, params) {

  /* eslint-disable-next-line no-unused-vars */
  async function postLogoutRedirectUri(ctx) {
    debug('postLogoutRedirectUri function returning: %s', params.postLogoutRedirectUri);
    return params.postLogoutRedirectUri;
  }

  const qewd_adapter = adapter(this);
  const Account = account(this);

  const configuration = {
    claims: params.Claims,
    findById: Account.findById,

    interactionUrl(ctx) {
      return `/interaction/${ctx.oidc.uuid}`;
    },

    logoutSource: logoutSource,

    features: {
      devInteractions: false,
      sessionManagement: true
    }
  };

  if (params.cookies) {
    configuration.cookies = params.cookies;
  }
  if (!configuration.cookies) configuration.cookies = {};
  if (!configuration.cookies.keys) {
    configuration.cookies.keys = ['mySecret1', 'mySecret2', 'mySecret3'];
  }
  if (!configuration.cookies.thirdPartyCheckUrl) {
    configuration.cookies.thirdPartyCheckUrl = 'https://cdn.rawgit.com/panva/3rdpartycookiecheck/92fead3f/start.html';
  }

  if (params.postLogoutRedirectUri) {
    debug('loading postLogoutRedirectUri: %s', params.postLogoutRedirectUri);
    configuration.postLogoutRedirectUri = postLogoutRedirectUri;
  }

  let issuer = params.issuer.host;
  if (params.issuer.port) issuer = issuer + ':' + params.issuer.port;
  issuer = issuer + '/openid';

  const oidc = new Provider(issuer, configuration);

  oidc.initialize({
    keystore: params.keystore,
    adapter: qewd_adapter
  }).then(() => {

    app.set('trust proxy', true);
    app.set('view engine', 'ejs');
    app.set('views', path.resolve(__dirname, 'views'));

    const parse = bodyParser.urlencoded({ extended: false });

    app.get('/interaction/logout', async (req, res) => {
      debug('logout redirection page');
      res.render('logout');
    });

    app.get('/interaction/:grant', async (req, res) => {
      oidc.interactionDetails(req).then((details) => {
        debug('see what else is available to you for interaction views: %j', details);

        const view = (() => {
          switch (details.interaction.reason) {
            case 'consent_prompt':
            case 'client_not_authorized':
            return 'interaction';
            default:
            return 'login';
          }
        })();

        res.render(view, { details });
      });
    });

    app.post('/interaction/:grant/confirm', parse, async (req, res) => {
      oidc.interactionFinished(req, res, {
        consent: {},
      });
    });

    app.post('/interaction/:grant/login', parse, async (req, res, next) => {
      debug('interaction login function');
      debug('req = %j', util.inspect(req));

      Account.authenticate(req.body.email, req.body.password).then((account) => {
        if (account.error) {
          const details = {
            params: {
              error: account.error
            },
            uuid: req.params.grant
          };

          return res.render('login', { details });
        }

        debug('account: %j', account);

        oidc.interactionFinished(req, res, {
          login: {
            account: account.accountId,
            acr: '1',
            remember: !!req.body.remember,
            ts: Math.floor(Date.now() / 1000),
          },
          consent: {
            // TODO: remove offline_access from scopes if remember is not checked
          }
        });
      }).catch(next);
    });

    app.use('/openid', oidc.callback);
  });

  const keepAliveTimer = setInterval(() => {
    this.send_promise({
      type: 'keepAlive'
    });
  }, 1000000);

  this.on('stop', function() {
    debug('Stopping keepAliveTimer');
    clearInterval(keepAliveTimer);
  });

};
