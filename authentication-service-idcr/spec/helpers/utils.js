'use strict';

const fork = require('child_process').fork;

module.exports = {

  fork: (modulePath, options, callback) => {
    const cp = fork(modulePath, options);

    cp.on('message', (message) => {
      if (message.type === 'qewd:started') {
        setTimeout(callback, process.env.QEWD_STARTED_TIMEOUT || 1000);
      }
    });

    return cp;
  },

  exit: (cp, callback) => {
    cp.on('exit', () => setTimeout(callback, process.env.EXIT_TIMEOUT || 1000));
    cp.kill();
  }
};
