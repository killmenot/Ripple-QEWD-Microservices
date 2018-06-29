'use strict';

const qewd = require('qewd').master;
const path = require('path');
const jwtConfig = require('../../../jwt_secret.json');
const msRoutes = require('../../support/routes.json');
const xp = qewd.intercept();
const q = xp.q;

q.on('start', function () {
  this.worker.loaderFilePath = path.join(__dirname, '../../..', 'node_modules/ewd-qoper8-worker.js');
});

q.on('started', function () {
  process.send({
    type: 'qewd:started'
  });
});

/*jshint camelcase: false */
const config = {
  managementPassword: 'keepThisSecret!',
  port: 8080,
  database: {
    type: 'redis'
  },
  jwt: jwtConfig,
  u_services: {
    destinations: {
      authentication_service: {
        host: 'http://127.0.0.1:8085',
        application: 'ripple-auth'
      }
    },
    routes: msRoutes
  }
};
/*jshint camelcase: true */

const routes = [
  {
    path: '/api',
    module: path.join(__dirname, 'local/handlers'),
    errors: {
      notfound: {
        text: 'Resource Not Recognised',
        statusCode: 404
      }
    }
  }
];

qewd.start(config, routes);
