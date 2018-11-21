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

describe('ripple-cdr-openehr/lib/handlers/getPatientSynopsis', () => {
  let getPatientSynopsis;

  let q;
  let args;
  let finished;

  let fetchAndCacheHeading;
  let getHeadingBySourceId;

  let qewdSession;

  function seeds() {
    const patientHeadingCache = qewdSession.data.$(['headings', 'byPatientId', 9999999000]);

    const proceduresByDateCache = patientHeadingCache.$(['procedures', 'byDate']);
    proceduresByDateCache.$([1514764800000, 'ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee']).value = '';
    proceduresByDateCache.$([1517432400000, 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d']).value = '';
    proceduresByDateCache.$([1519851600000, 'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be']).value = '';

    const vaccinationsByDateCache = patientHeadingCache.$(['vaccinations', 'byDate']);
    vaccinationsByDateCache.$([1514764800000, 'marand-ce437b97-4f6e-4c96-89bb-0b58b29a79cb']).value = '';
    vaccinationsByDateCache.$([1517432400000, 'ethercis-df4e5cc4-3e38-449e-8d44-8c0c47488931']).value = '';
    vaccinationsByDateCache.$([1519851600000, 'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee']).value = '';
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
      req: {
        query: {},
        qewdSession: q.sessions.create('app')
      }
    };
    finished = jasmine.createSpy();

    fetchAndCacheHeading = jasmine.createSpy().and.callFake(fetchAndCacheHeadingFake);
    mockery.registerMock('../src/fetchAndCacheHeading', fetchAndCacheHeading);

    getHeadingBySourceId = jasmine.createSpy().and.callFake(getHeadingBySourceIdFake);
    mockery.registerMock('../src/getHeadingBySourceId', getHeadingBySourceId);

    delete require.cache[require.resolve('../../../lib/handlers/getPatientSynopsis')];
    getPatientSynopsis = require('../../../lib/handlers/getPatientSynopsis');

    qewdSession = args.req.qewdSession;
    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    getPatientSynopsis.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return patient synopsis', () => {
    getPatientSynopsis.call(q, args, finished);

    // fetchAndCacheHeading
    expect(fetchAndCacheHeading).toHaveBeenCalledTimes(2);
    [
      'procedures',
      'vaccinations'
    ].forEach((heading, i) => {
      expect(fetchAndCacheHeading.calls.thisArgFor(i)).toBe(q);
      expect(fetchAndCacheHeading.calls.argsFor(i)).toEqual([9999999000, heading, qewdSession, jasmine.any(Function)]);
    });

    // getHeadingBySourceId
    [
      'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
      'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d',
      'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee',
      'ethercis-df4e5cc4-3e38-449e-8d44-8c0c47488931',
    ].forEach((sourceId, i) => {
      expect(getHeadingBySourceId.calls.thisArgFor(i)).toBe(q);
      expect(getHeadingBySourceId.calls.argsFor(i)).toEqual([sourceId, qewdSession, 'synopsis']);
    });

    expect(finished).toHaveBeenCalledWith({
      procedures: [
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
      ],
      vaccinations: [
        {
          sourceId: 'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee',
          source: 'marand',
          text: 'quux'
        },
        {
          sourceId: 'ethercis-df4e5cc4-3e38-449e-8d44-8c0c47488931',
          source: 'ethercis',
          text: 'quux'
        }
      ]
    });
  });

  it('should return patient synopsis with another order of headings in config', () => {
    q.userDefined.synopsis.headings = [
      'procedures',
      'vaccinations'
    ];

    getPatientSynopsis.call(q, args, finished);

    // fetchAndCacheHeading
    expect(fetchAndCacheHeading).toHaveBeenCalledTimes(2);
    [
      'procedures',
      'vaccinations'
    ].forEach((heading, i) => {
      expect(fetchAndCacheHeading.calls.thisArgFor(i)).toBe(q);
      expect(fetchAndCacheHeading.calls.argsFor(i)).toEqual([9999999000, heading, qewdSession, jasmine.any(Function)]);
    });

    // getHeadingBySourceId
    [
      'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
      'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d',
      'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee',
      'ethercis-df4e5cc4-3e38-449e-8d44-8c0c47488931',
    ].forEach((sourceId, i) => {
      expect(getHeadingBySourceId.calls.thisArgFor(i)).toBe(q);
      expect(getHeadingBySourceId.calls.argsFor(i)).toEqual([sourceId, qewdSession, 'synopsis']);
    });

    expect(finished).toHaveBeenCalledWith({
      procedures: [
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
      ],
      vaccinations: [
        {
          sourceId: 'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee',
          source: 'marand',
          text: 'quux'
        },
        {
          sourceId: 'ethercis-df4e5cc4-3e38-449e-8d44-8c0c47488931',
          source: 'ethercis',
          text: 'quux'
        }
      ]
    });
  });

  it('should return patient synopsis when maximum passed via query', () => {
    args.req.query.maximum = 1;

    getPatientSynopsis.call(q, args, finished);

    // fetchAndCacheHeading
    expect(fetchAndCacheHeading).toHaveBeenCalledTimes(2);
    [
      'procedures',
      'vaccinations'
    ].forEach((heading, i) => {
      expect(fetchAndCacheHeading.calls.thisArgFor(i)).toBe(q);
      expect(fetchAndCacheHeading.calls.argsFor(i)).toEqual([9999999000, heading, qewdSession, jasmine.any(Function)]);
    });

    // getHeadingBySourceId
    [
      'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
      'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee',
    ].forEach((sourceId, i) => {
      expect(getHeadingBySourceId.calls.thisArgFor(i)).toBe(q);
      expect(getHeadingBySourceId.calls.argsFor(i)).toEqual([sourceId, qewdSession, 'synopsis']);
    });

    expect(finished).toHaveBeenCalledWith({
      procedures: [
        {
          sourceId: 'ethercis-ae3886df-21e2-4249-97d6-d0612ae8f8be',
          source: 'ethercis',
          text: 'quux'
        }
      ],
      vaccinations: [
        {
          sourceId: 'marand-e5770469-7c26-47f7-afe0-57bce80eb2ee',
          source: 'marand',
          text: 'quux'
        }
      ]
    });
  });
});
