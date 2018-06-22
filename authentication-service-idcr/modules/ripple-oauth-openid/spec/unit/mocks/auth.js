'use strict';

const authConfig = require('../../authConfig.json');
const clone = require('../../helpers/utils').clone;

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
