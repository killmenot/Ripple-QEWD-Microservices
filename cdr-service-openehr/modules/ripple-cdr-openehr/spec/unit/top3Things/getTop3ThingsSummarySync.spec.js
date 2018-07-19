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

const Worker = require('../../mocks/worker');
const getTop3ThingsSummarySync = require('../../../lib/top3Things/getTop3ThingsSummarySync');

describe('ripple-cdr-openehr/lib/top3Things/getTop3ThingsSummarySync', () => {
  let q;
  let patientId;

  function seeds() {
    const top3Things = q.db.use('Top3Things');

    top3Things.$(['byPatient', 9999999000, 'latest']).value = 'ce437b97-4f6e-4c96-89bb-0b58b29a79cb';
    top3Things.$(['bySourceId', 'ce437b97-4f6e-4c96-89bb-0b58b29a79cb']).setDocument({
      date: 1519851600000,
      data: {
        name1: 'foo1',
        description1: 'baz1',
        name2: 'foo2',
        description2: 'baz2',
        name3: 'foo3',
        description3: 'baz3'
      }
    });
  }

  beforeEach(() => {
    q = new Worker();

    patientId = 9999999000;

    seeds();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return emply list', () => {
    patientId = 9434765919;

    const actual = getTop3ThingsSummarySync.call(q, patientId);

    expect(actual).toEqual([]);
  });

  it('should return top 3 things summary', () => {
    const actual = getTop3ThingsSummarySync.call(q, patientId);

    expect(actual).toEqual([
      {
        source: 'QEWDDB',
        sourceId: 'ce437b97-4f6e-4c96-89bb-0b58b29a79cb',
        dateCreated: 1519851600000,
        name1: 'foo1',
        name2: 'foo2',
        name3: 'foo3'
      }
    ]);
  });
});
