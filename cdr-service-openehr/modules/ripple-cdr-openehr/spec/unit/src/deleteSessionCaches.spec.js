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

  11 July 2018

*/

'use strict';

const Worker = require('../../mocks/worker');
const deleteSessionCaches = require('../../../lib/src/deleteSessionCaches');

describe('ripple-cdr-openehr/lib/src/deleteSessionCaches', () => {
  let q;
  let patientId;
  let heading;
  let host;

  function seeds() {
    const session1 = q.sessions.create('app1');
    const session2 = q.sessions.create('app2');

    const byPatientIdCache = session1.data.$(['headings', 'byPatientId', 9999999000, 'procedures']);
    byPatientIdCache.$(['byDate', 1514764800000, '0f7192e9-168e-4dea-812a-3e1d236ae46d']).value = '';
    byPatientIdCache.$(['byHost', 'marand', '0f7192e9-168e-4dea-812a-3e1d236ae46d']).value = '';

    const bySourceIdCache = session1.data.$(['headings', 'bySourceId']);
    bySourceIdCache.$('0f7192e9-168e-4dea-812a-3e1d236ae46d').setDocument({date: 1514764800000});

    return [
      session1,
      session2
    ];
  }

  beforeEach(() => {
    q = new Worker();

    patientId = 9999999000;
    heading = 'procedures';
    host = 'marand';
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should delete session caches', () => {
    const sourceId = '0f7192e9-168e-4dea-812a-3e1d236ae46d';
    const date = 1514764800000;

    const sessions = seeds();

    deleteSessionCaches.call(q, patientId, heading, host);

    const byPatientIdCache = sessions[0].data.$(['headings', 'byPatientId', patientId, heading]);
    expect(byPatientIdCache.$(['byDate', date, sourceId]).exists).toBeFalsy();
    expect(byPatientIdCache.$(['byHost', host, sourceId]).exists).toBeFalsy();

    const bySourceIdCache = sessions[0].data.$(['headings', 'bySourceId']);
    expect(bySourceIdCache.$(sourceId).exists).toBeFalsy();
  });
});
