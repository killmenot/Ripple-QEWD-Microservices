/*

 ----------------------------------------------------------------------------
 | ripple-openehr-jumper: Automated OpenEHR Template Access                 |
 |                                                                          |
 | Copyright (c) 2016-18 Ripple Foundation Community Interest Company       |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
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

  22 July 2018

*/

'use strict';

const Worker = require('../mocks/worker');
const addPatientDataToCache = require('../../lib/addPatientDataToCache');

describe('ripple-openehr-jumper/lib/addPatientDataToCache', () => {
  let q;
  let results;
  let patientId;
  let host;
  let heading;

  let qewdSession;
  let qewdSessionData;
  let headingCache;

  function seeds() {
    headingCache.$(['bySourceId', 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6']).setDocument({
      data: {
        foo: 'bar'
      }
    });
  }

  beforeEach(() => {
    q = new Worker();

    /*jshint camelcase: false */
    results = [
      {
        uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
        context: {
          start_time: {
            value: '2018-01-15T12:47:11UTC'
          }
        }
      }
    ];
    /*jshint camelcase: true */
    patientId = 9999999000;
    host = 'ethercis';
    heading = 'allergies';

    qewdSession = q.sessions.create('app');
    qewdSessionData = qewdSession.data;
    headingCache = qewdSession.data.$('headings');

    seeds();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should add patient data to cache', () => {
    const sourceId = 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6';
    const date = 1516009631000;

    addPatientDataToCache.call(q, results, patientId, host, heading, qewdSessionData);

    /*jshint camelcase: false */
    const cacheBySourceId = headingCache.$(['bySourceId', sourceId]);
    expect(cacheBySourceId.getDocument()).toEqual({
      uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
      patientId: 9999999000,
      heading: 'allergies',
      host: 'ethercis',
      date: 1516009631000,
      jumperFormatData: {
        uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
        context: {
          start_time: {
            value: '2018-01-15T12:47:11UTC'
          }
        }
      }
    });
    /*jshint camelcase: true */

    const cacheByPatientId = headingCache.$(['byPatientId', patientId, heading]);
    expect(cacheByPatientId.$(['byDate', date, sourceId]).value).toBe('');
    expect(cacheByPatientId.$(['byHost', host, sourceId]).value).toBe('');

    const cacheByHeading = headingCache.$('byHeading');
    expect(cacheByHeading.$([heading, sourceId]).value).toBe('');
  });

  it('should get rid of standard data cache (temporary)', () => {
    const sourceId = 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6';

    addPatientDataToCache.call(q, results, patientId, host, heading, qewdSessionData);

    expect(headingCache.$(['bySourceId', sourceId, 'data']).exists).toBeFalsy();
  });

  it('should add patient data to cache when date is not UTC', () => {
    /*jshint camelcase: false */
    results = [
      {
        uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
        context: {
          start_time: {
            value: '2018-01-01T12:00:00Z'
          }
        }
      }
    ];
    /*jshint camelcase: true */

    const sourceId = 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6';
    const date = 1514808000000;

    addPatientDataToCache.call(q, results, patientId, host, heading, qewdSessionData);

    /*jshint camelcase: false */
    const cacheBySourceId = headingCache.$(['bySourceId', sourceId]);
    expect(cacheBySourceId.getDocument()).toEqual({
      uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
      patientId: 9999999000,
      heading: 'allergies',
      host: 'ethercis',
      date: 1514808000000,
      jumperFormatData: {
        uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
        context: {
          start_time: {
            value: '2018-01-01T12:00:00Z'
          }
        }
      }
    });
    /*jshint camelcase: true */

    const cacheByPatientId = headingCache.$(['byPatientId', patientId, heading]);
    expect(cacheByPatientId.$(['byDate', date, sourceId]).value).toBe('');
    expect(cacheByPatientId.$(['byHost', host, sourceId]).value).toBe('');

    const cacheByHeading = headingCache.$('byHeading');
    expect(cacheByHeading.$([heading, sourceId]).value).toBe('');
  });

  it('should add patient data to cache when no date', () => {
    results = [
      {
        uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1'
      }
    ];

    const sourceId = 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6';

    addPatientDataToCache.call(q, results, patientId, host, heading, qewdSessionData);

    const cacheBySourceId = headingCache.$(['bySourceId', sourceId]);
    expect(cacheBySourceId.getDocument()).toEqual({
      uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
      patientId: 9999999000,
      heading: 'allergies',
      host: 'ethercis',
      jumperFormatData: {
        uid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1'
      }
    });

    const cacheByPatientId = headingCache.$(['byPatientId', patientId, heading]);
    expect(cacheByPatientId.$('byDate').getDocument()).toEqual({});
    expect(cacheByPatientId.$(['byHost', host, sourceId]).value).toBe('');

    const cacheByHeading = headingCache.$('byHeading');
    expect(cacheByHeading.$([heading, sourceId]).value).toBe('');
  });
});
