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

  5 August 2018

*/

'use strict';

const Qoper8 = require('../mocks/qoper8');
const initializeAdapter = require('../../lib/adapter');

describe('qewd-openid-connect/lib/adapter', () => {
  let q;
  let Adapter;
  let adapter;
  let name;

  function getClientFake(message) {
    if (message.params.id === 'bqz') {
      return Promise.resolve({
        error: 'some error'
      });
    }

    if (message.params.id === 'baz') {
      return Promise.resolve({
        message: {
          foo: 'baz',
          ewd_application: 'app'
        }
      });
    }
  }

  beforeAll(() => {
    jasmine.clock().install();
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  beforeEach(() => {
    q = new Qoper8();
    Adapter = initializeAdapter(q);

    name = 'quux';
  });

  it('should be initialized with correct props', () => {
    adapter = new Adapter(name);

    expect(adapter.name).toBe('quux');
  });

  describe('#key', () => {
    it('should return correct key', () => {
      const expected = 'quux:baz';

      adapter = new Adapter(name);
      const actual = adapter.key('baz');

      expect(actual).toEqual(expected);
    });
  });

  describe('#destroy', () => {
    const expiresIn = 10;

    beforeEach(() => {
      adapter = new Adapter(name);
    });

    it('should delete key', async () => {
      await adapter.upsert('baz', { foo: 'bar' }, expiresIn);

      await adapter.destroy('baz');

      const actual = await adapter.find('baz');
      expect(actual).toBeUndefined();
    });

    it('should delete all keys linked to grantId', async () => {
      await adapter.upsert('baz', {grantId: 'app'}, expiresIn);
      await adapter.upsert('baq', {grantId: 'app'}, expiresIn);
      await adapter.upsert('bax', {grantId: 'app'}, expiresIn);

      await adapter.destroy('baz');

      ['baz', 'baq', 'bax'].forEach(async (id) => {
        const actual = await adapter.find(id);
        expect(actual).toBeUndefined();
      });
    });
  });

  describe('find', () => {
    beforeEach(() => {
      q.send_promise.and.callFake(getClientFake);
    });

    it('should return data', async () => {
      adapter = new Adapter(name);
      await adapter.upsert('baz', 'foo', 10);

      const actual = await adapter.find('baz');

      expect(actual).toBe('foo');
    });

    it('should return empty object when client adapter returns error', async () => {
      adapter = new Adapter('Client');

      const actual = await adapter.find('bqz');

      expect(q.send_promise).toHaveBeenCalledWith({
        type: 'getClient',
        params: {
          id: 'bqz'
        }
      });
      expect(actual).toEqual({});
    });

    it('should return data when client adapter returns message', async () => {
      adapter = new Adapter('Client');

      const actual = await adapter.find('baz');

      expect(q.send_promise).toHaveBeenCalledWith({
        type: 'getClient',
        params: {
          id: 'baz'
        }
      });
      expect(actual).toEqual({ foo: 'baz' });
    });
  });

  describe('#upsert', () => {
    beforeEach(() => {
      adapter = new Adapter(name);
    });

    it('should insert key', async () => {
      await adapter.upsert('baz', 'foo', 10);

      const actual = await adapter.find('baz');

      expect(actual).toBe('foo');
    });

    it('should update key', async () => {
      await adapter.upsert('baz', 'foo', 10);
      await adapter.upsert('baz', 'bar', 10);

      const actual = await adapter.find('baz');

      expect(actual).toBe('bar');
    });
  });

  describe('#consume', () => {
    beforeEach(() => {
      adapter = new Adapter(name);
    });

    it('should set consumed to current time UTC', async () => {
      const nowTime = Date.UTC(2018, 0, 1); // 151476480000, now
      jasmine.clock().mockDate(new Date(nowTime));

      await adapter.upsert('baz', { foo: 'bar' }, 10);

      await adapter.consume('baz');

      const actual = await adapter.find('baz');

      expect(actual).toEqual({
        foo: 'bar',
        consumed: 1514764800
      });
    });
  });
});
