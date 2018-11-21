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

describe('ripple-cdr-openehr/lib/handlers/getPatientHeadingSynopsis', () => {
  let getPatientHeadingSynopsis;

  let q;
  let args;
  let finished;

  let fetchAndCacheHeading;
  let getHeadingBySourceId;

  let qewdSession;

  function seeds() {
    const patientHeadingCache = qewdSession.data.$(['headings', 'byPatientId', 9999999000]);

    const headingByDateCache = patientHeadingCache.$(['procedures', 'byDate']);
    headingByDateCache.$([1514764800000, 'ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee']).value = '';
    headingByDateCache.$([1517432400000, 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d']).value = '';
    headingByDateCache.$([1519851600000, 'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be']).value = '';
  }

  function fetchAndCacheHeadingFake(patientId, heading, session, callback) {
    callback();
  }

  function getHeadingBySourceIdFake(sourceId) {
    const host = sourceId.split('-')[0];

    return {
      sourceId: sourceId,
      source: host,
      text: 'quux'
    };
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
        qewdSession: q.sessions.create('app'),
        query: {}
      },
      session: {
        nhsNumber: 9434765919,
        role: 'IDCR'
      }
    };
    finished = jasmine.createSpy();

    fetchAndCacheHeading = jasmine.createSpy().and.callFake(fetchAndCacheHeadingFake);
    mockery.registerMock('../src/fetchAndCacheHeading', fetchAndCacheHeading);

    getHeadingBySourceId = jasmine.createSpy().and.callFake(getHeadingBySourceIdFake);
    mockery.registerMock('../src/getHeadingBySourceId', getHeadingBySourceId);

    delete require.cache[require.resolve('../../../lib/handlers/getPatientHeadingSynopsis')];
    getPatientHeadingSynopsis = require('../../../lib/handlers/getPatientHeadingSynopsis');

    qewdSession = args.req.qewdSession;
    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    getPatientHeadingSynopsis.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return heading missing or empty error', () => {
    delete args.heading;

    getPatientHeadingSynopsis.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Heading missing or empty'
    });
  });

  it('should return invalid or missing heading error', () => {
    args.heading = 'bar';

    getPatientHeadingSynopsis.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith([]);
  });

  it('should return patient heading synopsis', () => {
    getPatientHeadingSynopsis.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', qewdSession, jasmine.any(Function)
    );

    [
      'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
      'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d'
    ].forEach((sourceId, i) => {
      expect(getHeadingBySourceId.calls.thisArgFor(i)).toBe(q);
      expect(getHeadingBySourceId.calls.argsFor(i)).toEqual([sourceId, qewdSession, 'synopsis']);
    });

    expect(finished).toHaveBeenCalledWith({
      heading: 'procedures',
      synopsis: [
        {
          sourceId: 'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
          source: 'ethercis',
          text: 'quux'
        },
        {
          sourceId: 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d',
          source: 'marand',
          text: 'quux'
        }
      ]
    });
  });

  it('should return patient synopsis when maximum passed via query', () => {
    args.req.query.maximum = 1;

    getPatientHeadingSynopsis.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', qewdSession, jasmine.any(Function)
    );

    [
      'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be'
    ].forEach((sourceId, i) => {
      expect(getHeadingBySourceId.calls.thisArgFor(i)).toBe(q);
      expect(getHeadingBySourceId.calls.argsFor(i)).toEqual([sourceId, qewdSession, 'synopsis']);
    });

    expect(finished).toHaveBeenCalledWith({
      heading: 'procedures',
      synopsis: [
        {
          sourceId: 'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
          source: 'ethercis',
          text: 'quux'
        }
      ]
    });
  });

  it('should override patientId for PHR users', () => {
    args.session.role = 'phrUser';

    getPatientHeadingSynopsis.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9434765919, 'procedures', qewdSession, jasmine.any(Function)
    );

    expect(finished).toHaveBeenCalledWith({
      heading: 'procedures',
      synopsis: []
    });
  });
});
