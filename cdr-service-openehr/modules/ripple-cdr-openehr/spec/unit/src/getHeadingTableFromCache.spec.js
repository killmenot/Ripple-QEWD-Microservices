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

describe('ripple-cdr-openehr/lib/src/getHeadingTableFromCache', () => {
  let getHeadingTableFromCache;
  let getHeadingBySourceId;

  let q;
  let patientId;
  let heading;
  let session;

  function seeds() {
    const byHost = session.data.$(['headings', 'byPatientId', 9999999000, 'procedures', 'byHost']);
    byHost.$(['marand', '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4']).value = '';
    byHost.$(['ethercis', '74b6a24b-bd97-47f0-ac6f-a632d0cac60f']).value = '';
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

    patientId = 9999999000;
    heading = 'procedures';
    session = q.sessions.create('app');

    getHeadingBySourceId = jasmine.createSpy();
    mockery.registerMock('./getHeadingBySourceId', getHeadingBySourceId);
    delete require.cache[require.resolve('../../../lib/src/getHeadingTableFromCache')];
    getHeadingTableFromCache = require('../../../lib/src/getHeadingTableFromCache');

    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return heading table', () => {
    const expected = [
      {
        desc: 'foo',
        source: 'ethercis',
        sourceId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
      },
      {
        desc: 'bar',
        source: 'marand',
        sourceId: '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4'
      }
    ];

    getHeadingBySourceId.withArgs('74b6a24b-bd97-47f0-ac6f-a632d0cac60f', session, 'summary').and.returnValue(expected[0]);
    getHeadingBySourceId.withArgs('41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4', session, 'summary').and.returnValue(expected[1]);

    const actual = getHeadingTableFromCache.call(q, patientId, heading, session);

    expect(getHeadingBySourceId).toHaveBeenCalledTimes(2);
    expect(getHeadingBySourceId.calls.argsFor(0)).toEqual(['74b6a24b-bd97-47f0-ac6f-a632d0cac60f', session, 'summary']);
    expect(getHeadingBySourceId.calls.argsFor(1)).toEqual(['41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4', session, 'summary']);
    expect(actual).toEqual(expected);
  });
});
