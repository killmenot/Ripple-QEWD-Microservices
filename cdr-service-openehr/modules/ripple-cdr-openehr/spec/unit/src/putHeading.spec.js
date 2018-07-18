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

  18 July 2018

*/

'use strict';

const nock = require('nock');
const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/src/putHeading', () => {
  let putHeading;
  let postHeadingByJumper;

  let q;
  let patientId;
  let heading;
  let compositionId;
  let data;
  let qewdSession;
  let callback;

  const fakeResponses = {
    session: {
      sessionId: '182bdb28-d257-4a99-9a41-441c49aead0c'
    },
    ehr: {
      ehrId: '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4'
    },
    putHeading: {
      compositionUid: '61ee3e4e-b49e-431b-a34f-9f1fe6702b86',
      action: 'some action'
    }
  };

  function startSessionHttpMock(data) {
    nock('http://178.62.71.220:8080')
      .post('/rest/v1/session?username=bar&password=quux')
      .matchHeader('x-max-session', 75)
      .matchHeader('x-session-timeout', 120000)
      .reply(200, data || {});
  }

  function httpEhrMock(sessionId, data) {
    nock('http://178.62.71.220:8080')
      .get(`/rest/v1/ehr?subjectId=${patientId}&subjectNamespace=uk.nhs.nhs_number`)
      .matchHeader('ehr-session', sessionId)
      .reply(200, data || {});
  }

  function httpPutHeadingMock(sessionId, ehrId, data) {
    nock('http://178.62.71.220:8080')
      .put('/rest/v1/composition/61ee3e4e-b49e-431b-a34f-9f1fe6702b86', {
        'ctx/composer_name': 'Dr Tony Shannon',
        'procedures_list/procedures/procedure:0/procedure_name|value': 'some name'
      })
      .query({
        templateId: 'IDCR - Procedures List.v1',
        //ehrId: ehrId,
        format: 'FLAT'
      })
      .matchHeader('ehr-session', sessionId)
      .reply(200, data || {});
  }

  function seeds() {
    const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', patientId, heading]);
    byPatientIdCache.$(['byDate', 1514764800000, '0f7192e9-168e-4dea-812a-3e1d236ae46d']).value = '';
    byPatientIdCache.$(['byHost', 'ethercis', '0f7192e9-168e-4dea-812a-3e1d236ae46d']).value = '';

    const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']);
    bySourceIdCache.$('0f7192e9-168e-4dea-812a-3e1d236ae46d').setDocument({date: 1514764800000});
  }

  function headingsMocks() {
     /*jshint camelcase: false */
    mockery.registerMock('../headings/procedures', {
      name: 'procedures',
      textFieldName: 'name',
      headingTableFields: ['desc'],
      post: {
        templateId: 'IDCR - Procedures List.v1',
        transformTemplate: {
          ctx: {
            composer_name: '=> either(author, "Dr Tony Shannon")',
          },
          procedures_list: {
            procedures: {
              procedure: [
                {
                  'procedure_name|value': '{{procedureName}}'
                }
              ]
            }
          }
        }
      }
    });
     /*jshint camelcase: true */

    mockery.registerMock('../headings/counts', {
      name: 'counts',
      textFieldName: 'name',
      headingTableFields: ['desc']
    });
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

    patientId = 9999999000;
    heading = 'procedures';
    compositionId = '61ee3e4e-b49e-431b-a34f-9f1fe6702b86';
    data = {
      procedureName: 'some name'
    };
    qewdSession = q.sessions.create('app');
    callback = jasmine.createSpy();

    postHeadingByJumper = jasmine.createSpy();
    mockery.registerMock('../../../ripple-openehr-jumper/lib/postHeading', postHeadingByJumper);
    delete require.cache[require.resolve('../../../lib/src/putHeading')];
    putHeading = require('../../../lib/src/putHeading');

    seeds();
    headingsMocks();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return heading not recognised or no POST definition available error', () => {
    heading = 'counts';

    putHeading.call(q, patientId, heading, compositionId, data, qewdSession, callback);

    expect(callback).toHaveBeenCalledWith({
      error: 'heading counts not recognised, or no POST definition available'
    });
  });

  it('should return unable to establish a session with host error', (done) => {
    startSessionHttpMock();

    putHeading.call(q, patientId, heading, compositionId, data, qewdSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        error: 'Unable to establish a session with ethercis'
      });

      done();
    }, 100);
  });

  describe('ripple-openehr-jumper', () => {
    beforeEach(() => {
      heading = 'vaccinations';
    });

    it('should post heading by jumper', () => {
      const expectedParams = {
        patientId: 9999999000,
        heading: 'vaccinations',
        data: {
          procedureName: 'some name'
        },
        qewdSession: qewdSession,
        defaultHost: 'ethercis',
        method: 'put',
        compositionId: '61ee3e4e-b49e-431b-a34f-9f1fe6702b86'
      };

      putHeading.call(q, patientId, heading, compositionId, data, qewdSession, callback);

      expect(postHeadingByJumper).toHaveBeenCalledWithContext(q, expectedParams, callback);
    });
  });

  it('should put heading and delete session caches', (done) => {
    const expected = {};

    const sessionId = fakeResponses.session.sessionId;
    const ehrId = fakeResponses.ehr.ehrId;

    startSessionHttpMock(fakeResponses.session);
    httpEhrMock(sessionId, fakeResponses.ehr);
    httpPutHeadingMock(sessionId, ehrId, fakeResponses.putHeading);

    putHeading.call(q, patientId, heading, compositionId, data, qewdSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', patientId, heading]);
      expect(byPatientIdCache.getDocument()).toEqual(expected);

      const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']);
      expect(bySourceIdCache.getDocument()).toEqual(expected);

      done();
    }, 100);
  });

  it('should put heading and return false when no data returned', (done) => {
    const sessionId = fakeResponses.session.sessionId;
    const ehrId = fakeResponses.ehr.ehrId;

    startSessionHttpMock(fakeResponses.session);
    httpEhrMock(sessionId, fakeResponses.ehr);
    httpPutHeadingMock(sessionId, ehrId);

    putHeading.call(q, patientId, heading, compositionId, data, qewdSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        ok: false
      });

      done();
    }, 100);
  });

  it('should put heading and return response with composition uid and action', (done) => {
    const sessionId = fakeResponses.session.sessionId;
    const ehrId = fakeResponses.ehr.ehrId;

    startSessionHttpMock(fakeResponses.session);
    httpEhrMock(sessionId, fakeResponses.ehr);
    httpPutHeadingMock(sessionId, ehrId, fakeResponses.putHeading);

    putHeading.call(q, patientId, heading, compositionId, data, qewdSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        ok: true,
        host: 'ethercis',
        heading: 'procedures',
        compositionUid: '61ee3e4e-b49e-431b-a34f-9f1fe6702b86',
        action: 'some action'
      });

      done();
    }, 100);
  });
});
