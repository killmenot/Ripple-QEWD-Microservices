'use strict';

const fork = require('child_process').fork;
const DEFAULT_TIMEOUT = 1000;

module.exports = {

  fork: (modulePath, options, callback) => {
    const cp = fork(modulePath, options);

    cp.on('message', (message) => {
      if (message.type === 'qewd:started') {
        setTimeout(callback, process.env.QEWD_STARTED_TIMEOUT || DEFAULT_TIMEOUT);
      }
    });

    return cp;
  },

  exit: (cp, callback) => {
    cp.on('exit', () => setTimeout(callback, process.env.EXIT_TIMEOUT || DEFAULT_TIMEOUT));
    cp.kill();
  }
};
