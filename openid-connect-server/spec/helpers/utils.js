'use strict';

const NetcatClient = require('netcat/client');

module.exports = {
  stop: (name, callback) => {
    const nc = new NetcatClient();

    nc.unixSocket('/tmp/docker.sock').enc('utf8')
      .on('data', (msg) => {
        console.log(msg)
      })
      .on('close', callback)
      .on('error', callback)
      .connect()
      .send(`POST /containers/${name}/stop HTTP/1.0\r\n\r\n`)
  }
};
