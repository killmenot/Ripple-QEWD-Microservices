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

  08 October 2018

*/

const Provider = require('/opt/qewd/node_modules/oidc-provider');
const account = require('./account');
const adapter = require('./adapter');
const logoutSource = require('./logoutSource');

var path = require('path');
//var util = require('util');

module.exports = function(app, bodyParser, params) {

  console.log('OpenId Connect Server Loader starting with params:');
  console.log(JSON.stringify(params, null, 2));

  var qewd_adapter = adapter(this);
  var Account = account(this);
  var q = this;

  const configuration = {
    claims: params.Claims,
    findById: Account.findById,

    interactionUrl(ctx) {
      //return params.path_prefix + `/interaction/${ctx.oidc.uuid}`;
      return `/openid/interaction/${ctx.oidc.uuid}`;
    },

    logoutSource: logoutSource,

    features: {
      devInteractions: false,
      clientCredentials: true,
      introspection: true,
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

    console.log('loading postLogoutRedirectUri: ' + params.postLogoutRedirectUri)

    async function postLogoutRedirectUri(ctx) {
      console.log('postLogoutRedirectUri function returning ' + params.postLogoutRedirectUri);
      return params.postLogoutRedirectUri;
    }

    configuration.postLogoutRedirectUri = postLogoutRedirectUri;
  }

  var issuer = params.issuer.host;
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

    app.get('/openid/interaction/logout', async (req, res) => {
      //console.log('*** logout redirection page');
      res.render('logout');
    });

    app.get('/openid/interaction/:grant', async (req, res) => {
      oidc.interactionDetails(req).then((details) => {
        //details.path_prefix = params.path_prefix;
        console.log('see what else is available to you for interaction views', details);
        
        if (details.uuid && details.params && details.params.scope) {
          var scope = details.params.scope;
          q.handleMessage({
            type: 'saveGrant',
            params: {
              grant: details.uuid,
              scope: scope
            },
            token: q.openid_server.token
          });
        }
        

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

    app.post('/openid/interaction/:grant/confirm', parse, (req, res) => {
      oidc.interactionFinished(req, res, {
        consent: {},
      });
    });

    app.post('/openid/interaction/:grant/login', parse, (req, res, next) => {
      //console.log('*** interaction login function');
      //console.log('req = ' + util.inspect(req));

      Account.authenticate(req.body.email, req.body.password, req.params.grant).then((account) => {
        if (account.error) {
          var details = {
            params: {
              error: account.error
            },
            uuid: req.params.grant
          };
          res.render('login', {details});
          return;
        }

        var details = {
          params: {},
          uuid: req.params.grant
        }
        res.render('confirmCode', {details});

        /*
        console.log('** account: ' + JSON.stringify(account));
        oidc.interactionFinished(req, res, {
          login: {
            account: account.accountId,
            acr: '1',
            remember: !!req.body.remember,
            ts: Math.floor(Date.now() / 1000),
          },
          consent: {
            // TODO: remove offline_access from scopes if remember is not checked
          },
        });
        */
      }).catch(next);
    });


    app.post('/openid/interaction/:grant/confirmCode', parse, (req, res, next) => {
      Account.confirmCode(req.body.confirmCode, req.params.grant).then((results) => {
        if (results.error) {
          var details = {
            params: {
              error: results.error
            },
            uuid: req.params.grant
          };
          res.render('confirmCode', {details});
          return;
        }

        console.log('** account: ' + JSON.stringify(results.accountId));

        // now we need to force a password change if this is the first login with temporary password
        // if results.resetPassword is true

        if (results.resetPassword) {
          var details = {
            params: {},
            uuid: req.params.grant
          }
          res.render('resetPassword', {details});
        }
        else {
          try {
            oidc.interactionFinished(req, res, {
              login: {
                account: results.accountId,
                acr: '1',
                remember: false,
                ts: Math.floor(Date.now() / 1000),
              },
              consent: {
                // TODO: remove offline_access from scopes if remember is not checked
              },
            });
          }
          catch(err) {
            // grant has timed out
            location.reload();
          }
        }
      }).catch(next);
    });

    app.post('/openid/interaction/:grant/changePassword', parse, (req, res, next) => {
      Account.changePassword(req.body.password, req.body.password2, req.params.grant).then((results) => {
        if (results.error) {
          var details = {
            params: {
              error: results.error
            },
            uuid: req.params.grant
          };
          if (results.expired) {
            res.render('login', {details});
          }
          else {
            res.render('resetPassword', {details});
          }
          return;
        }

        // successfully logged in and password updated

        oidc.interactionFinished(req, res, {
          login: {
            account: results.accountId,
            acr: '1',
            remember: false,
            ts: Math.floor(Date.now() / 1000),
          },
          consent: {
            // TODO: remove offline_access from scopes if remember is not checked
          },
        });
      }).catch(next);
    });

    app.get('/openid/interaction/:grant/forgotPassword', parse, (req, res, next) => {
      var details = {
        params: {},
        uuid: req.params.grant
      };
      res.render('forgotPassword', {details});
    });

    app.post('/openid/interaction/:grant/requestNewPassword', parse, (req, res, next) => {
      Account.requestNewPassword(req.body.email).then((results) => {
        var details;
        if (results.error) {
          details = {
            params: {
              error: results.error
            },
            uuid: req.params.grant
          };
          res.render('forgotPassword', {details});
          return;
        }
        details = {
          params: {
            error: 'Use the temporary password that has been emailed to you'
          },
          uuid: req.params.grant
        };
        res.render('login', {details});
      }).catch(next);
    });

    app.use('/openid', oidc.callback);
  });

  var self = this;
  var keepAliveTimer = setInterval(function() {
    self.send_promise({
      type: 'keepAlive'
    });
  }, 1000000);

  this.on('stop', function() {
    console.log('Stopping keepAliveTimer');
    clearInterval(keepAliveTimer);
  });

};
