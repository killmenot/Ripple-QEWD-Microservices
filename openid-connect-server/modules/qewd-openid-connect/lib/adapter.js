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

  4 July 2018

*/

'use strict';

const LRU = require('lru-cache');
const epochTime = require('oidc-provider/lib/helpers/epoch_time');
const storage = new LRU({});
const debug = require('debug')('qewd-openid-connect:adapter');

function grantKeyFor(id) {
  return `grant:${id}`;
}

function initialise_adapter(qoper8) {
  debug('initialise adapter');

  const q = qoper8;

  class qewd_adapter {

    constructor(name) {
      this.name = name;
    }

    key(id) {
      return `${this.name}:${id}`;
    }

    destroy(id) {
      debug('destroy: %s', id);

      const key = this.key(id);
      const grantId = storage.get(key) && storage.get(key).grantId;
      debug('key = %s, grantId = %s', key, grantId);

      console.log('** destroy: id = ' + id);
      console.log('key = ' + key);

      q.handleMessage({
        type: 'deleteGrant',
        params: {
          grant: id
        },
        token: q.openid_server.token
      });

      storage.del(key);

      if (grantId) {
        const grantKey = grantKeyFor(grantId);

        storage.get(grantKey).forEach(token => storage.del(token));
      }

      return Promise.resolve();
    }

    consume(id) {
      debug('consume: %s', id);

      const key = this.key(id);
      debug('key = %s', key);
      storage.get(key).consumed = epochTime();

      return Promise.resolve();
    }

    async find(id) {
      debug('find: id = %s for name = %s', id, this.name);

      let results;
      let key;

      if (this.name === 'Client') {
        results = await q.send_promise({
          type: 'getClient',
          params: {
            id: id
          }
        })
        .then (function(result) {
          debug('result = %j', result);
          if (result.error) return {};
          delete result.message.ewd_application;
          debug('returned message = %j', result.message);
          return result.message;
        });

        debug('results = %j', results);

        return results;
      }
      else {
        key = this.key(id);
        results = storage.get(key);
        debug('key = %s, results = %j', key, results);

        return Promise.resolve(results);
      }
    }

    upsert(id, payload, expiresIn) {
      debug('upsert: id = %s, payload = %j,expiresIn = %d', id, payload, expiresIn);

      const key = this.key(id);
      const { grantId } = payload;

      debug('key = %s, grantId = %s', key, grantId);

      if (grantId) {
        const grantKey = grantKeyFor(grantId);
        const grant = storage.get(grantKey);
        if (!grant) {
          storage.set(grantKey, [key]);
        } else {
          grant.push(key);
        }
      }

      storage.set(key, payload, expiresIn * 1000);

      return Promise.resolve();
    }

    static connect(provider) { // eslint-disable-line no-unused-vars
      // noop
    }
  }

  return qewd_adapter;
}

module.exports = initialise_adapter;
