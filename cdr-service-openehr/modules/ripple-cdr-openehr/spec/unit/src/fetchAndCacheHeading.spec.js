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

  12 July 2018

*/

'use strict';

const nock = require('nock');
const template = require('qewd-template');
const Worker = require('../../mocks/worker');
const loadAQLFile = require('../../../lib/src/loadAQLFile');
const fetchAndCacheHeading = require('../../../lib/src/fetchAndCacheHeading');

describe('ripple-cdr-openehr/lib/src/fetchAndCacheHeading', () => {
  let q;
  let patientId;
  let heading;
  let session;
  let callback;

  const aql = {};
  const fakeResponses = {
    marand: {
      session: {
        sessionId: '182bdb28-d257-4a99-9a41-441c49aead0c'
      },
      ehr: {
        ehrId: '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4'
      }
    },
    ethercis: {
      session: {
        sessionId: 'ae3886df-21e2-4249-97d6-d0612ae8f8be'
      },
      ehr: {
        ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
      }
    }
  };

  function httpSessionMock(host, data) {
    const { url, username, password } = q.userDefined.openehr[host];

    nock(url)
      .post(`/rest/v1/session?username=${username}&password=${password}`)
      .matchHeader('x-max-session', 75)
      .matchHeader('x-session-timeout', 120000)
      .reply(200, data || {});
  }

  function httpEhrMock(host, patientId, sessionId, data) {
    const { url } = q.userDefined.openehr[host];

    nock(url)
      .get(`/rest/v1/ehr?subjectId=${patientId}&subjectNamespace=uk.nhs.nhs_number`)
      .matchHeader('ehr-session', sessionId)
      .reply(200, data || {});
  }

  function httpQueryMock(host, heading, sessionId, ehrId) {
    const { url } = q.userDefined.openehr[host];

    const subs = { ehrId };
    const aqlQuery = template.replace(aql[heading], subs);

    nock(url)
      .get('/rest/v1/query')
      .query({
        aql: aqlQuery
      })
      .matchHeader('ehr-session', sessionId)
      .reply(200, {});
  }

  beforeAll(() => {
    const headings = [
      'procedures'
    ];
    headings.forEach(x => aql[x] = loadAQLFile(x));
  });

  beforeEach(() => {
    q = new Worker();

    patientId = 9999999000;
    heading = 'procedures';
    session = q.sessions.create('app');
    callback = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should use cached headings', () => {
    const byPatientIdCache = session.data.$(['headings', 'byPatientId', patientId, heading]);
    byPatientIdCache.$(['byHost', 'marand', '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4']).value = '';
    byPatientIdCache.$(['byHost', 'ethercis', '74b6a24b-bd97-47f0-ac6f-a632d0cac60f']).value = '';

    fetchAndCacheHeading.call(q, patientId, heading, session);
  });

  it('should use cached headings with callback', () => {
    const byPatientIdCache = session.data.$(['headings', 'byPatientId', patientId, heading]);
    byPatientIdCache.$(['byHost', 'marand', '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4']).value = '';
    byPatientIdCache.$(['byHost', 'ethercis', '74b6a24b-bd97-47f0-ac6f-a632d0cac60f']).value = '';

    fetchAndCacheHeading.call(q, patientId, heading, session, callback);

    expect(callback).toHaveBeenCalledWith({ok: true});
  });

  it('should stop when unable to establish a session on host error', (done) => {
    httpSessionMock('marand');
    httpSessionMock('ethercis');

    fetchAndCacheHeading.call(q, patientId, heading, session);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      done();
    }, 100);
  });

  it('should stop with callback when unable to establish a session on host error', (done) => {
    httpSessionMock('marand');
    httpSessionMock('ethercis');

    fetchAndCacheHeading.call(q, patientId, heading, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({ok: true});

      done();
    }, 100);
  });

  it('should stop when no ehrId found by NHS number', (done) => {
    httpSessionMock('marand', fakeResponses.marand.session);
    httpSessionMock('ethercis', fakeResponses.ethercis.session);

    httpEhrMock('marand', patientId, fakeResponses.marand.session.sessionId);
    httpEhrMock('ethercis', patientId, fakeResponses.ethercis.session.sessionId);

    fetchAndCacheHeading.call(q, patientId, heading, session);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      done();
    }, 100);
  });

  it('should stop with callback when no ehrId found by NHS number', (done) => {
    httpSessionMock('marand', fakeResponses.marand.session);
    httpSessionMock('ethercis', fakeResponses.ethercis.session);

    httpEhrMock('marand', patientId, fakeResponses.marand.session.sessionId);
    httpEhrMock('ethercis', patientId, fakeResponses.ethercis.session.sessionId);

    fetchAndCacheHeading.call(q, patientId, heading, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({ok: true});

      done();
    }, 100);
  });

  it('should send request to get heading from openEHR server', (done) => {
    const { marand, ethercis } = fakeResponses;

    httpSessionMock('marand', marand.session);
    httpSessionMock('ethercis', ethercis.session);

    httpEhrMock('marand', patientId, marand.session.sessionId, marand.ehr);
    httpEhrMock('ethercis', patientId, ethercis.session.sessionId, ethercis.ehr);

    httpQueryMock('marand', heading,  marand.session.sessionId, marand.ehr.ehrId);
    httpQueryMock('ethercis', heading,  ethercis.session.sessionId, ethercis.ehr.ehrId);

    fetchAndCacheHeading.call(q, patientId, heading, session);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      done();
    }, 100);
  });

  it('should send request to get heading from openEHR server with callback', (done) => {
    const { marand, ethercis } = fakeResponses;

    httpSessionMock('marand', marand.session);
    httpSessionMock('ethercis', ethercis.session);

    httpEhrMock('marand', patientId, marand.session.sessionId, marand.ehr);
    httpEhrMock('ethercis', patientId, ethercis.session.sessionId, ethercis.ehr);

    httpQueryMock('marand', heading,  marand.session.sessionId, marand.ehr.ehrId);
    httpQueryMock('ethercis', heading,  ethercis.session.sessionId, ethercis.ehr.ehrId);

    fetchAndCacheHeading.call(q, patientId, heading, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({ok: true});

      done();
    }, 100);
  });

});
