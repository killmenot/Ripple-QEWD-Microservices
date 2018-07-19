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

describe('ripple-cdr-openehr/lib/handlers/getHeadingDetail', () => {
  let getHeadingDetail;

  let q;
  let args;
  let finished;

  let fetchAndCacheHeading;
  let getHeadingDetailFromCache;

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
      sourceId: 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d',
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
    getHeadingDetailFromCache = jasmine.createSpy();
    mockery.registerMock('../src/getHeadingDetailFromCache', getHeadingDetailFromCache);

    delete require.cache[require.resolve('../../../lib/handlers/getHeadingDetail')];
    getHeadingDetail = require('../../../lib/handlers/getHeadingDetail');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    getHeadingDetail.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return empty array when heading has not yet been added to middle-tier processing', () => {
    args.heading = 'bar';

    getHeadingDetail.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith([]);
  });

  it('should return empty array when invalid sourceId', () => {
    args.sourceId = 'ethercis-foobar';

    getHeadingDetail.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith([]);
  });

  it('should return empty array when no results could be returned from the OpenEHR servers for heading', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: false});
    });

    getHeadingDetail.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith([]);
  });

  it('should get detail when heading for patient cached', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });
    const results = {
      name: 'quux',
      desc: 'baz',
      source: 'marand',
      sourceId: 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d'
    };
    getHeadingDetailFromCache.and.returnValue(results);

    getHeadingDetail.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
    expect(getHeadingDetailFromCache).toHaveBeenCalledWithContext(
      q, 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d', args.req.qewdSession
    );
    expect(finished).toHaveBeenCalledWith({
      responseFrom: 'phr_service',
      results: {
        name: 'quux',
        desc: 'baz',
        source: 'marand',
        sourceId: 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d'
      }
    });
  });

  it('should override patientId for PHR users', () => {
    args.session.role = 'phrUser';

    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });

    getHeadingDetail.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9434765919, 'procedures', args.req.qewdSession, jasmine.any(Function)
    );
  });
});
