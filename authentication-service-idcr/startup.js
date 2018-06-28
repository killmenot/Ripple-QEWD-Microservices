'use strict';

var config = require('./startup_config.json');
config.jwt = require('./jwt_secret.json');
var local_routes = require('./local_routes.json');

// set userDefined to either Auth0 or OpenId Connect version

var userDefined = require('./userDefined-auth0.json');
//var userDefined = require('./userDefined-openid.json');

if (process.env.NODE_ENV === 'test') {
  userDefined = require('./spec/support/userDefined-auth0.json');
}

module.exports = {
  config: config,
  routes: local_routes,
  userDefined: userDefined
};

