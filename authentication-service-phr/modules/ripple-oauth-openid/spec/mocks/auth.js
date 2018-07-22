'use strict';

const authConfig = require('../support/authConfig.json');
const clone = require('../helpers/utils').clone;

module.exports = {
  mock: function () {
    return {
      config: clone(authConfig),
      client: {
        authorizationCallback: jasmine.createSpy()
      }
    };
  }
};
