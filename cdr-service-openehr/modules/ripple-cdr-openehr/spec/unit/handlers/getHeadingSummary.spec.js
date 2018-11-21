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

  19 July 2018

*/

'use strict';

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/getHeadingSummary', () => {
  let getHeadingSummary;

  let q;
  let args;
  let finished;

  let fetchAndCacheHeading;
  let getHeadingTableFromCache;

  let qewdSession;

  function seeds() {
    const patientId = args.patientId;
    const heading = args.heading;

    qewdSession.data.$(['headings', 'byPatientId', patientId, heading, 'fetch_count']).value = 7;
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

    args = {
      patientId: 9999999000,
      heading: 'procedures',
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        nhsNumber: 9434765919,
        role: 'IDCR'
      }
    };
    finished = jasmine.createSpy();

    fetchAndCacheHeading = jasmine.createSpy();
    mockery.registerMock('../src/fetchAndCacheHeading', fetchAndCacheHeading);
    getHeadingTableFromCache = jasmine.createSpy();
    mockery.registerMock('../src/getHeadingTableFromCache', getHeadingTableFromCache);

    delete require.cache[require.resolve('../../../lib/handlers/getHeadingSummary')];
    getHeadingSummary = require('../../../lib/handlers/getHeadingSummary');

    qewdSession = args.req.qewdSession
    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    getHeadingSummary.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return empty array when heading has not yet been added to middle-tier processing', () => {
    args.heading = 'bar';

    getHeadingSummary.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith([]);
  });

  it('should return empty array when no results could be returned from the OpenEHR servers for heading', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: false});
    });

    getHeadingSummary.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith([]);
  });

  it('should get summary when heading for patient cached', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });

    const results = [
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
    getHeadingTableFromCache.and.returnValue(results);

    getHeadingSummary.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
    expect(getHeadingTableFromCache).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession
    );
    expect(finished).toHaveBeenCalledWith({
      responseFrom: 'phr_service',
      patientId: 9999999000,
      heading: 'procedures',
      fetch_count: 8,
      results: results
    });
  });

  it('should override patientId for PHR users', () => {
    args.session.role = 'phrUser';

    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });

    getHeadingSummary.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9434765919, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
  });
});
