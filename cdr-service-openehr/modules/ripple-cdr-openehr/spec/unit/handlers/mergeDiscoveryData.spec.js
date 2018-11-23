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

  23 November 2018

*/

'use strict';

const nock = require('nock');
const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/mergeDiscoveryData', () => {
  let mergeDiscoveryData;

  let q;
  let args;
  let finished;

  let qewdSession;
  let discoveryMap;

  let postHeading;
  let deleteSessionCaches;

  function seeds() {
    discoveryMap.$(['by_discovery_sourceId', '2c9a7b22-4cdd-484e-a8b5-759a70443be3']).value = 'ethercis-foo'
    discoveryMap.$(['by_discovery_sourceId', '11f87140-05f4-480a-a1d7-f4a2049dcf3']).value = 'ethercis-bar'
  }

  function startSessionHttpMock(data) {
    nock('http://178.62.71.220:8080')
      .post('/rest/v1/session?username=bar&password=quux')
      .matchHeader('x-max-session', 75)
      .matchHeader('x-session-timeout', 120000)
      .reply(200, data || {});
  }

  function httpEhrMock(sessionId, data) {
    nock('http://178.62.71.220:8080')
      .get('/rest/v1/ehr?subjectId=9999999000&subjectNamespace=uk.nhs.nhs_number')
      .matchHeader('ehr-session', sessionId)
      .reply(200, data || {});
  }

  const fakeResponses = {
    session: {
      sessionId: '182bdb28-d257-4a99-9a41-441c49aead0c'
    },
    ehr: {
      ehrId: '41bc6370-33a4-4ae1-8b3d-d2d9cfe606a4'
    }
  };

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
      heading: 'procedures',
      req: {
        qewdSession: q.sessions.create('app'),
        session: {
          nhsNumber: 9999999000
        },
        data: [
          {
            sourceId: '2c9a7b22-4cdd-484e-a8b5-759a70443be3'
          },
          {
            sourceId: '11f87140-05f4-480a-a1d7-f4a2049dcf3'
          }
        ]
      },
      session: {
        //nhsNumber: 9999999000
      }
    };
    finished = jasmine.createSpy();

    postHeading = jasmine.createSpy();
    mockery.registerMock('../src/postHeading', postHeading);

    deleteSessionCaches = jasmine.createSpy();
    mockery.registerMock('../src/deleteSessionCaches', deleteSessionCaches);

    delete require.cache[require.resolve('../../../lib/handlers/mergeDiscoveryData')];
    mergeDiscoveryData = require('../../../lib/handlers/mergeDiscoveryData');

    qewdSession = args.req.qewdSession;
    discoveryMap = new q.documentStore.DocumentNode('DiscoveryMap');

    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return need refresh when record is ready', () => {
    args.heading = 'finished';

    mergeDiscoveryData.call(q, args, finished);

    expect(qewdSession.data.$(['record_status']).getDocument()).toEqual({
      status: 'ready'
    })

    expect(finished).toHaveBeenCalledWith({
      refresh: true
    });
  });

  it('should return refresh not needed when no discovery data items', () => {
    args.req.data = [];

    mergeDiscoveryData.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      refresh: false
    });
  });

  it('should return refresh not needed when all records exists in discovery cache', (done) => {
    const sessionId = fakeResponses.session.sessionId;

    startSessionHttpMock(fakeResponses.session);
    httpEhrMock(sessionId, fakeResponses.ehr);

    mergeDiscoveryData.call(q, args, finished);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(finished).toHaveBeenCalledWith({
        refresh: false
      });

      done();
    }, 100);
  });

  it('should return refresh not needed when record not found discovery cache and no response from OpenEHR', (done) => {
    const sessionId = fakeResponses.session.sessionId;

    startSessionHttpMock(fakeResponses.session);
    httpEhrMock(sessionId, fakeResponses.ehr);

    args.req.data = [
      {
        sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
      }
    ];

    postHeading.and.callFake((patientId, heading, data, session, callback) => callback());

    mergeDiscoveryData.call(q, args, finished);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(postHeading).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', {
        data: {
          sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
        },
        format: 'pulsetile',
        source: 'GP'
      }, qewdSession, jasmine.any(Function));
      expect(finished).toHaveBeenCalledWith({
        refresh: false
      });

      done();
    }, 100);
  });

  it('should return need refresh, save OpenEHR response to discovery map and delete cache', (done) => {
    const sessionId = fakeResponses.session.sessionId;

    startSessionHttpMock(fakeResponses.session);
    httpEhrMock(sessionId, fakeResponses.ehr);

    args.req.data = [
      {
        sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
      }
    ];

    const postHeadingData = {
      compositionUid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1'
    };
    postHeading.and.callFake((patientId, heading, data, session, callback) => callback(postHeadingData));

    mergeDiscoveryData.call(q, args, finished);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      expect(postHeading).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', {
        data: {
          sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
        },
        format: 'pulsetile',
        source: 'GP'
      }, qewdSession, jasmine.any(Function));

      expect(discoveryMap.$(['by_discovery_sourceId']).getDocument()).toEqual({
        '11f87140-05f4-480a-a1d7-f4a2049dcf3': 'ethercis-bar',
        '2c9a7b22-4cdd-484e-a8b5-759a70443be3': 'ethercis-foo',
        'eaf394a9-5e05-49c0-9c69-c710c77eda76': 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6'
      });
      expect(discoveryMap.$(['by_openehr_sourceId']).getDocument()).toEqual({
        'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6': {
          discovery: 'eaf394a9-5e05-49c0-9c69-c710c77eda76',
          heading: 'procedures',
          openehr: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
          patientId: 9999999000
        }
      });

      expect(deleteSessionCaches).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', 'ethercis');

      expect(finished).toHaveBeenCalledWith({
        refresh: true
      });

      done();
    }, 100);
  });

  describe('both records not in cache but second has error response', () => {
    beforeEach(() => {
      args.req.data = [
        {
          sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
        },
        {
          sourceId: '0493561a-4279-45b6-ab17-e3cd3ffd7a70'
        }
      ];
    });

    it('should return need refresh, save first response to discovery map and delete cache', (done) => {
      const sessionId = fakeResponses.session.sessionId;

      startSessionHttpMock(fakeResponses.session);
      httpEhrMock(sessionId, fakeResponses.ehr);

      const postHeadingData = {
        'eaf394a9-5e05-49c0-9c69-c710c77eda76': {
          compositionUid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1'
        },
        '0493561a-4279-45b6-ab17-e3cd3ffd7a70': {
          error: 'some error'
        }
      };
      postHeading.and.callFake(
        (patientId, heading, data, session, callback) => {
          callback(postHeadingData[data.data.sourceId])
        }
      );

      mergeDiscoveryData.call(q, args, finished);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();

        expect(postHeading).toHaveBeenCalledTimes(2);

        args.req.data.forEach((record, i) => {
          expect(postHeading.calls.thisArgFor(i)).toBe(q);
          expect(postHeading.calls.argsFor(i)).toEqual(
            [9999999000, 'procedures', {
              data: record,
              format: 'pulsetile',
              source: 'GP'
            }, qewdSession, jasmine.any(Function)]
          );
        });

        expect(discoveryMap.$(['by_discovery_sourceId']).getDocument()).toEqual({
          '11f87140-05f4-480a-a1d7-f4a2049dcf3': 'ethercis-bar',
          '2c9a7b22-4cdd-484e-a8b5-759a70443be3': 'ethercis-foo',
          'eaf394a9-5e05-49c0-9c69-c710c77eda76': 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6'
        });
        expect(discoveryMap.$(['by_openehr_sourceId']).getDocument()).toEqual({
          'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6': {
            discovery: 'eaf394a9-5e05-49c0-9c69-c710c77eda76',
            heading: 'procedures',
            openehr: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
            patientId: 9999999000
          }
        });

        expect(deleteSessionCaches).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', 'ethercis');

        expect(finished).toHaveBeenCalledWith({
          refresh: true
        });

        done();
      }, 100);
    });
  });

  describe('both records not in cache but first has error response', () => {
    beforeEach(() => {
      args.req.data = [
        {
          sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
        },
        {
          sourceId: '0493561a-4279-45b6-ab17-e3cd3ffd7a70'
        }
      ];
    });

    it('should return need refresh, save first response to discovery map and delete cache', (done) => {
      const sessionId = fakeResponses.session.sessionId;

      startSessionHttpMock(fakeResponses.session);
      httpEhrMock(sessionId, fakeResponses.ehr);

      const postHeadingData = {
        'eaf394a9-5e05-49c0-9c69-c710c77eda76': {
          error: 'some error'
        },
        '0493561a-4279-45b6-ab17-e3cd3ffd7a70': {
          compositionUid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1'
        }
      };
      postHeading.and.callFake(
        (patientId, heading, data, session, callback) => {
          callback(postHeadingData[data.data.sourceId])
        }
      );

      mergeDiscoveryData.call(q, args, finished);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();

        expect(postHeading).toHaveBeenCalledTimes(2);

        args.req.data.forEach((record, i) => {
          expect(postHeading.calls.thisArgFor(i)).toBe(q);
          expect(postHeading.calls.argsFor(i)).toEqual(
            [9999999000, 'procedures', {
              data: record,
              format: 'pulsetile',
              source: 'GP'
            }, qewdSession, jasmine.any(Function)]
          );
        });

        expect(discoveryMap.$(['by_discovery_sourceId']).getDocument()).toEqual({
          '11f87140-05f4-480a-a1d7-f4a2049dcf3': 'ethercis-bar',
          '2c9a7b22-4cdd-484e-a8b5-759a70443be3': 'ethercis-foo',
          '0493561a-4279-45b6-ab17-e3cd3ffd7a70': 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6'
        });
        expect(discoveryMap.$(['by_openehr_sourceId']).getDocument()).toEqual({
          'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6': {
            discovery: '0493561a-4279-45b6-ab17-e3cd3ffd7a70',
            heading: 'procedures',
            openehr: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
            patientId: 9999999000
          }
        });

        expect(deleteSessionCaches).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', 'ethercis');

        expect(finished).toHaveBeenCalledWith({
          refresh: true
        });

        done();
      }, 100);
    });
  });

  describe('first record not in cache but second is already cached', () => {
    beforeEach(() => {
      args.req.data[0].sourceId = 'eaf394a9-5e05-49c0-9c69-c710c77eda76';
    });

    it('should return need refresh, save first response to discovery map and delete cache', (done) => {
      const sessionId = fakeResponses.session.sessionId;

      startSessionHttpMock(fakeResponses.session);
      httpEhrMock(sessionId, fakeResponses.ehr);

      const postHeadingData = {
        compositionUid: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1'
      };
      postHeading.and.callFake((patientId, heading, data, session, callback) => callback(postHeadingData));

      mergeDiscoveryData.call(q, args, finished);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();

        expect(postHeading).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', {
          data: {
            sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
          },
          format: 'pulsetile',
          source: 'GP'
        }, qewdSession, jasmine.any(Function));

        expect(discoveryMap.$(['by_discovery_sourceId']).getDocument()).toEqual({
          '11f87140-05f4-480a-a1d7-f4a2049dcf3': 'ethercis-bar',
          '2c9a7b22-4cdd-484e-a8b5-759a70443be3': 'ethercis-foo',
          'eaf394a9-5e05-49c0-9c69-c710c77eda76': 'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6'
        });
        expect(discoveryMap.$(['by_openehr_sourceId']).getDocument()).toEqual({
          'ethercis-188a6bbe-d823-4fca-a79f-11c64af5c2e6': {
            discovery: 'eaf394a9-5e05-49c0-9c69-c710c77eda76',
            heading: 'procedures',
            openehr: '188a6bbe-d823-4fca-a79f-11c64af5c2e6::vm01.ethercis.org::1',
            patientId: 9999999000
          }
        });

        expect(deleteSessionCaches).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', 'ethercis');

        expect(finished).toHaveBeenCalledWith({
          refresh: true
        });

        done();
      }, 100);
    });
  });
});
