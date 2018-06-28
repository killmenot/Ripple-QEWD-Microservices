'use strict';

const router = require('qewd-router');

module.exports = {
  init: function (application) {
    router.setErrorResponse(404, 'Not Found');
    this.setCustomErrorResponse.call(this, {
      application: application,
      errorType: 'noTypeHandler',
      text: 'Resource Not Found',
      statusCode: '404'
    });
  }
};
