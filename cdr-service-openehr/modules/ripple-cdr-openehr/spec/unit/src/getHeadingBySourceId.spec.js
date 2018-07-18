/*

 ----------------------------------------------------------------------------
 | ripple-cdr-openehr: Ripple MicroServices for OpenEHR                     |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the 'License');          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an 'AS IS' BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  17 July 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/src/getHeadingBySourceId', () => {
  let getHeadingBySourceId;
  let getFormattedRecordFromCache;

  let q;
  let sourceId;
  let session;
  let format;

  function seeds() {
    session.data.$(['headings', 'bySourceId', '2c9a7b22-4cdd-484e-a8b5-759a70443be3']).setDocument({
      heading: 'procedures',
      host: 'marand',
      data: {
        foo: 'quux',
        bar: 'baz'
      }
    });

    // process empty values
    session.data.$(['headings', 'bySourceId', '11f87140-05f4-480a-a1d7-f4a2049dcf3']).setDocument({
      heading: 'counts',
      host: 'marand'
    });

    // ripple-openehr-jumper
    session.data.$(['headings', 'bySourceId', 'a289d435-8089-4692-8e7f-c87803a82a6d']).setDocument({
      heading: 'vaccinations',
      host: 'ethercis',
      jumperFormatData: {
        foo: 'bar'
      }
    });

    // pulsetile
    session.data.$(['headings', 'bySourceId', '1c905678-e2f0-41d6-ad88-e1360113c2b3']).setDocument({
      heading: 'procedures',
      host: 'marand',
      data: {
        foo: 'quux',
        bar: 'baz'
      },
      pulsetile: {
        name: 'quux',
        desc: 'baz',
        source: 'marand',
        sourceId: '1c905678-e2f0-41d6-ad88-e1360113c2b3'
      }
    });
  }

  function headingsMocks() {
    mockery.registerMock('../headings/procedures', {
      name: 'procedures',
      textFieldName: 'name',
      headingTableFields: ['desc'],
      get: {
        transformTemplate: {
          name: '{{foo}}',
          desc: '{{bar}}'
        }
      }
    });
    mockery.registerMock('../headings/vaccinations', {
      name: 'vaccinations',
      jumperFormatData: 'foobar'
    });
    mockery.registerMock('../headings/counts', {
      name: 'counts',
      textFieldName: 'name',
      headingTableFields: ['name', 'desc'],
      get: {
        transformTemplate: {}
      }
    });
  }

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();

    sourceId = '2c9a7b22-4cdd-484e-a8b5-759a70443be3';
    session = q.sessions.create('app');
    format = 'detail';

    getFormattedRecordFromCache = jasmine.createSpy();
    mockery.registerMock('../../../ripple-openehr-jumper/lib/getFormattedRecordFromCache', getFormattedRecordFromCache);
    delete require.cache[require.resolve('../../../lib/src/getHeadingBySourceId')];
    getHeadingBySourceId = require('../../../lib/src/getHeadingBySourceId');

    seeds();
    headingsMocks();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return empty when sourceId is empty', () => {
    const expected = {};

    sourceId = '';
    const actual = getHeadingBySourceId.call(q, sourceId, session, format);

    expect(actual).toEqual(expected);
  });

  it('should return empty when record by sourceId exist', () => {
    const expected = {};

    sourceId = 'some-non-exist-source-id';
    const actual = getHeadingBySourceId.call(q, sourceId, session, format);

    expect(actual).toEqual(expected);
  });

  it('should return details', () => {
    const expected = {
      name: 'quux',
      desc: 'baz',
      source: 'marand',
      sourceId: '2c9a7b22-4cdd-484e-a8b5-759a70443be3'
    };

    const actual = getHeadingBySourceId.call(q, sourceId, session, format);

    expect(actual).toEqual(expected);
  });

  it('should return details when no format passed', () => {
    const expected = {
      name: 'quux',
      desc: 'baz',
      source: 'marand',
      sourceId: '2c9a7b22-4cdd-484e-a8b5-759a70443be3'
    };

    const actual = getHeadingBySourceId.call(q, sourceId, session);

    expect(actual).toEqual(expected);
  });

  describe('synopsis', () => {
    beforeEach(() => {
      format = 'synopsis';
    });

    it('should return synopsis', () => {
      const expected = {
        sourceId: '2c9a7b22-4cdd-484e-a8b5-759a70443be3',
        source: 'marand',
        text: 'quux'
      };

      const actual = getHeadingBySourceId.call(q, sourceId, session, format);

      expect(actual).toEqual(expected);
    });

    it('should process empty synopsis field', () => {
      const expected = {
        sourceId: '11f87140-05f4-480a-a1d7-f4a2049dcf3',
        source: 'marand',
        text: ''
      };

      sourceId = '11f87140-05f4-480a-a1d7-f4a2049dcf3';
      const actual = getHeadingBySourceId.call(q, sourceId, session, format);

      expect(actual).toEqual(expected);
    });
  });

  describe('summary', () => {
    beforeEach(() => {
      format = 'summary';
    });

    it('should return summary', () => {
      const expected = {
        desc: 'baz',
        source: 'marand',
        sourceId: '2c9a7b22-4cdd-484e-a8b5-759a70443be3'
      };

      const actual = getHeadingBySourceId.call(q, sourceId, session, format);

      expect(actual).toEqual(expected);
    });

    it('should process empty summary fields', () => {
      const expected = {
        sourceId: '11f87140-05f4-480a-a1d7-f4a2049dcf3',
        source: 'marand',
        name: '',
        desc: ''
      };

      sourceId = '11f87140-05f4-480a-a1d7-f4a2049dcf3';
      const actual = getHeadingBySourceId.call(q, sourceId, session, format);

      expect(actual).toEqual(expected);
    });
  });

  describe('pulsetile', () => {
    beforeEach(() => {
      sourceId = '1c905678-e2f0-41d6-ad88-e1360113c2b3';
    });

    it('should return formatted record from cache', () => {
      const expected = {
        desc: 'baz',
        name: 'quux',
        source: 'marand',
        sourceId: '1c905678-e2f0-41d6-ad88-e1360113c2b3'
      };

      const actual = getHeadingBySourceId.call(q, sourceId, session, format);

      expect(actual).toEqual(expected);
    });
  });

  describe('ripple-openehr-jumper', () => {
    beforeEach(() => {
      sourceId = 'a289d435-8089-4692-8e7f-c87803a82a6d';
    });

    it('should return formatted record from cache', () => {
      const expected = {foo: 'barbaz'};

      const output = {foo: 'barbaz'};
      getFormattedRecordFromCache.and.returnValue(output);

      const actual = getHeadingBySourceId.call(q, sourceId, session, format);

      expect(getFormattedRecordFromCache).toHaveBeenCalledWithContext(q, sourceId, 'pulsetile', session);
      expect(actual).toEqual(expected);
    });
  });
});
