'use strict';

module.exports = {
  mock: function () {
    return {
      Issuer: jasmine.createSpy()
    };
  }
};
