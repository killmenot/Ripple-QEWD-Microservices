/*

 ----------------------------------------------------------------------------
 | ripple-admin: Ripple User Administration MicroService                    |
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

const nock = require('nock');
const Worker = require('../../mocks/worker');
const deleteHeading = require('../../../lib/src/deleteHeading');

describe('ripple-cdr-openehr/lib/src/deleteHeading', () => {
  let q;
  let patientId;
  let heading;
  let compositionId;
  let host;
  let session;
  let callback;

  function startSessionHttpMock(data) {
    nock('https://test.operon.systems')
      .post('/rest/v1/session?username=foo&password=123456')
      .matchHeader('x-max-session', 75)
      .matchHeader('x-session-timeout', 120000)
      .reply(200, data);
  }

  beforeEach(() => {
    q = new Worker();

    patientId = 9999999000;
    compositionId = '2db1f70d-5e62-4348-9935-9f799b2718dd';
    heading = 'procedures';
    host = 'marand';
    session = q.sessions.create('app');
    callback = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return unable to establish a session with host error', (done) => {
    const data = {};

    startSessionHttpMock(data);

    deleteHeading.call(q, patientId, heading, compositionId, host, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        error: 'Unable to establish a session with marand'
      });

      done();
    }, 100);
  });

  it('should delete heading', (done) => {
    const data = {
      sessionId: '03134cc0-3741-4d3f-916a-a279a24448e5'
    };

    startSessionHttpMock(data);

    nock('https://test.operon.systems')
      .delete('/rest/v1/composition/2db1f70d-5e62-4348-9935-9f799b2718dd')
      .matchHeader('Ehr-Session', data.sessionId)
      .reply(204);

    deleteHeading.call(q, patientId, heading, compositionId, host, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        deleted: true,
        patientId: 9999999000,
        heading: 'procedures',
        compositionId: '2db1f70d-5e62-4348-9935-9f799b2718dd',
        host: 'marand'
      });

      done();
    }, 100);
  });
});
