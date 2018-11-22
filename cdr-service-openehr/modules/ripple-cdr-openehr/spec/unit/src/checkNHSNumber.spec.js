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

  22 November 2018

*/

'use strict';

const nock = require('nock');
const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/src/checkNHSNumber', () => {
  let q;
  let checkNHSNumber;

  let patientId;
  let email;
  let session;
  let callback;

  let postFeed;

  function startSessionHttpMock(data) {
    nock('https://test.operon.systems')
      .post('/rest/v1/session?username=foo&password=123456')
      .matchHeader('x-max-session', 75)
      .matchHeader('x-session-timeout', 120000)
      .reply(200, data);
  }

  function httpGetEhrMock(sessionId, data) {
    nock('https://test.operon.systems')
      .get(`/rest/v1/ehr?subjectId=${patientId}&subjectNamespace=uk.nhs.nhs_number`)
      .matchHeader('ehr-session', sessionId)
      .reply(200, data);
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
    q.userDefined.defaultPostHost = 'marand';

    patientId = 9999999000;
    email = 'ivor.cox@ripple.foundation';
    session = q.sessions.create('app');
    callback = jasmine.createSpy();

    postFeed = jasmine.createSpy();
    mockery.registerMock('../feeds/post', postFeed);

    delete require.cache[require.resolve('../../../lib/src/checkNHSNumber')];
    checkNHSNumber = require('../../../lib/src/checkNHSNumber');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return unable to establish a session with host error', (done) => {
    const data = {};

    startSessionHttpMock(data);

    checkNHSNumber.call(q, patientId, email, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        error: 'Unable to establish a session with marand'
      });

      done();
    }, 100);
  });

  it('should return existing patient', (done) => {
    const data = {
      sessionId: '03134cc0-3741-4d3f-916a-a279a24448e5'
    };
    const ehrData = {
      patientId: 9999999000,
      heading: 'procedures',
      compositionId: '2db1f70d-5e62-4348-9935-9f799b2718dd',
      host: 'marand'
    }

    startSessionHttpMock(data);
    httpGetEhrMock(data.sessionId, ehrData);

    checkNHSNumber.call(q, patientId, email, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        new_patient: false,
        body: {
          patientId: 9999999000,
          heading: 'procedures',
          compositionId: '2db1f70d-5e62-4348-9935-9f799b2718dd',
          host: 'marand'
        }
      });

      done();
    }, 100);
  });

  it('should create a new record for patient in openEHR and return new patient', (done) => {
    const data = {
      sessionId: '03134cc0-3741-4d3f-916a-a279a24448e5'
    };
    const ehrData = {
      patientId: 9999999000,
      heading: 'procedures',
      compositionId: '2db1f70d-5e62-4348-9935-9f799b2718dd',
      host: 'marand'
    }

    postFeed.and.callFake((args, callback) => callback());

    startSessionHttpMock(data);
    httpGetEhrMock(data.sessionId);

    nock('https://test.operon.systems')
      .post('/rest/v1/ehr?subjectId=9999999000&subjectNamespace=uk.nhs.nhs_number', {
        subjectId: 9999999000,
        subjectNamespace: 'uk.nhs.nhs_number',
        queryable: 'true',
        modifiable: 'true'
      })
      .matchHeader('ehr-session', data.sessionId)
      .reply(200, ehrData);

    checkNHSNumber.call(q, patientId, email, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      expect(postFeed).toHaveBeenCalledWithContext(q, {
        session: {
          email: 'ivor.cox@ripple.foundation'
        },
        req: {
          body: {
            author: 'Helm PHR service',
            name: 'Leeds Live - Whats On',
            landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
            rssFeedUrl: 'https://www.leeds-live.co.uk/news/?service=rss'
          }
        }
      }, jasmine.any(Function));

      expect(callback).toHaveBeenCalledWith({
        new_patient: true,
        body: {
          patientId: 9999999000,
          heading: 'procedures',
          compositionId: '2db1f70d-5e62-4348-9935-9f799b2718dd',
          host: 'marand'
        }
      });

      done();
    }, 100);
  });
});
