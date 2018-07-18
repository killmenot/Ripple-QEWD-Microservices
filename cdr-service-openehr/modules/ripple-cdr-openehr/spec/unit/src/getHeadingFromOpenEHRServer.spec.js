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

const mockery = require('mockery');
const nock = require('nock');
const fsMock = require('mock-fs');
const Worker = require('../../mocks/worker');
const openEHR = require('../../../lib/src/openEHR');

describe('ripple-cdr-openehr/lib/src/getHeadingFromOpenEHRServer', () => {
  let getHeadingFromOpenEHRServer;
  let getHeadingByJumper;

  let q;
  let nhsNo;
  let heading;
  let host;
  let qewdSession;
  let openEhrSession;
  let callback;
  let ehrId;

  function httpMock(data) {
    nock('https://test.operon.systems')
      .get('/rest/v1/query')
      .matchHeader('ehr-session', openEhrSession.id)
      .query({
        aql: `START.${ehrId}.END`
      })
      .reply(200, data);
  }

  function seeds() {
    const nhsNoMap = q.db.use('RippleNHSNoMap', ['byNHSNo', nhsNo, host]);
    nhsNoMap.value = ehrId;
  }

  beforeAll(() => {
    mockery.enable();
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();

    nhsNo = 9999999000;
    heading = 'procedures';
    host = 'marand';
    qewdSession = q.sessions.create('app');
    openEhrSession = {
      id: '03134cc0-3741-4d3f-916a-a279a24448e5'
    };
    callback = jasmine.createSpy();

    getHeadingByJumper = jasmine.createSpy();
    mockery.registerMock('../../../ripple-openehr-jumper/lib/getHeadingFromOpenEHRServer', getHeadingByJumper);
    delete require.cache[require.resolve('../../../lib/src/getHeadingFromOpenEHRServer')];
    getHeadingFromOpenEHRServer = require('../../../lib/src/getHeadingFromOpenEHRServer');

    ehrId = '74b6a24b-bd97-47f0-ac6f-a632d0cac60f';
    seeds();

    fsMock({
      'lib/headings': {
        'procedures.aql': 'START.{{ehrId}}.END',
        'counts.aql': 'START.{{ehrId}}.END'
      }
    });
  });

  afterEach(() => {
    mockery.deregisterAll();
    fsMock.restore();
    q.db.reset();
  });

  it('should process response from openEHR server', (done) => {
    /*jshint camelcase: false */
    const expected = {
      heading: 'procedures',
      host: 'marand',
      patientId: 9999999000,
      date: 1514764800000,
      data: {
        uid: '3ada1098-d984-4e7a-85eb-174cba27ec40',
        date_created: 1514764800000
      },
      uid: '3ada1098-d984-4e7a-85eb-174cba27ec40'
    };
     /*jshint camelcase: true */

    /*jshint camelcase: false */
    const data = {
      resultSet: [
        {
          uid: '3ada1098-d984-4e7a-85eb-174cba27ec40',
          date_created: 1514764800000 // 1 Jan 2018
        }
      ]
    };
     /*jshint camelcase: true */

    httpMock(data);

    openEHR.init.call(q);
    getHeadingFromOpenEHRServer.call(q, nhsNo, heading, host, qewdSession, openEhrSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      const sourceId = 'marand-3ada1098-d984-4e7a-85eb-174cba27ec40';
      const date = 1514764800000;

      const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']);
      expect(bySourceIdCache.$(sourceId).getDocument()).toEqual(expected);

      const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', nhsNo, heading]);
      expect(byPatientIdCache.$(['byDate', date, sourceId]).value).toBe('');
      expect(byPatientIdCache.$(['byHost', host, sourceId]).value).toBe('');

      done();
    }, 100);
  });

  it('should process response from openEHR server when heading equals counts', (done) => {
    const expected = {
      heading: 'counts',
      host: 'marand',
      patientId: 9999999000,
      date: jasmine.any(Number),
      data: {
        ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f',
        uid: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f::',
        dateCreated: jasmine.any(Number)
      },
      uid: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f::'
    };

    const data = {
      resultSet: [
        {
          ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
        }
      ]
    };
    httpMock(data);

    heading = 'counts';

    openEHR.init.call(q);
    getHeadingFromOpenEHRServer.call(q, nhsNo, heading, host, qewdSession, openEhrSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      const sourceId = 'marand-74b6a24b-bd97-47f0-ac6f-a632d0cac60f';

      const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']);
      const record = bySourceIdCache.$(sourceId).getDocument();
      expect(record).toEqual(expected);

      const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', nhsNo, heading]);
      expect(byPatientIdCache.$(['byDate', record.date, sourceId]).value).toBe('');
      expect(byPatientIdCache.$(['byHost', host, sourceId]).value).toBe('');
      done();
    }, 100);
  });

  it('should process response from openEHR server when result has no uid', (done) => {
    const data = {
      resultSet: [
        {}
      ]
    };
    httpMock(data);

    openEHR.init.call(q);
    getHeadingFromOpenEHRServer.call(q, nhsNo, heading, host, qewdSession, openEhrSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']).getDocument();
      expect(bySourceIdCache).toEqual({});

      const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', nhsNo, heading]);
      expect(byPatientIdCache.$('byDate').getDocument()).toEqual({});
      expect(byPatientIdCache.$('byHost').getDocument()).toEqual({});
      done();
    }, 100);
  });

  it('should process response from openEHR server when no body returned', (done) => {
    httpMock();

    openEHR.init.call(q);
    getHeadingFromOpenEHRServer.call(q, nhsNo, heading, host, qewdSession, openEhrSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']).getDocument();
      expect(bySourceIdCache).toEqual({});

      const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', nhsNo, heading]);
      expect(byPatientIdCache.$('byDate').getDocument()).toEqual({});
      expect(byPatientIdCache.$('byHost').getDocument()).toEqual({});
      done();
    }, 100);
  });

  it('should process response from openEHR server when no resultSet', (done) => {
    httpMock({});

    openEHR.init.call(q);
    getHeadingFromOpenEHRServer.call(q, nhsNo, heading, host, qewdSession, openEhrSession, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();

      const bySourceIdCache = qewdSession.data.$(['headings', 'bySourceId']).getDocument();
      expect(bySourceIdCache).toEqual({});

      const byPatientIdCache = qewdSession.data.$(['headings', 'byPatientId', nhsNo, heading]);
      expect(byPatientIdCache.$('byDate').getDocument()).toEqual({});
      expect(byPatientIdCache.$('byHost').getDocument()).toEqual({});
      done();
    }, 100);
  });

  describe('ripple-openehr-jumper', () => {
    beforeEach(() => {
      heading = 'vaccinations';
    });

    it('should using Jumper to fetch heading', () => {
      openEHR.init.call(q);
      getHeadingFromOpenEHRServer.call(q, nhsNo, heading, host, qewdSession, openEhrSession, callback);

      expect(getHeadingByJumper).toHaveBeenCalledWithContext(q, {
        patientId: 9999999000,
        heading: 'vaccinations',
        host: 'marand',
        qewdSession: qewdSession,
        openEHR: openEHR,
        openEHRSession: openEhrSession,
        ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
      }, callback);
    });
  });
});
