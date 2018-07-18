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
const Worker = require('../../mocks/worker');
const openEHR = require('../../../lib/src/openEHR');
const mapNHSNoByHost = require('../../../lib/src/mapNHSNoByHost');

describe('ripple-cdr-openehr/lib/src/mapNHSNoByHost', () => {
  let q;
  let nhsNo;
  let host;
  let session;
  let callback;

  function httpEhrMock(data) {
    nock('https://test.operon.systems')
      .get(`/rest/v1/ehr?subjectId=${nhsNo}&subjectNamespace=uk.nhs.nhs_number`)
      .matchHeader('ehr-session', session.id)
      .reply(200, data || {});
  }

  beforeEach(() => {
    q = new Worker();

    nhsNo = 9999999000;
    host = 'marand';
    session = {
      id: '182bdb28-d257-4a99-9a41-441c49aead0c'
    };
    callback = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });


  it('should do nothing when no ehrId returned', (done) => {
    httpEhrMock();

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      done();
    }, 100);
  });

  it('should return nothing with callback when no ehrId returned', (done) => {
    httpEhrMock();

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should not retrieve ehrId when ehrId cached', () => {
    const nhsNoMap = q.db.use('RippleNHSNoMap', ['byNHSNo', nhsNo, host]);
    nhsNoMap.value = '74b6a24b-bd97-47f0-ac6f-a632d0cac60f';

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session);
  });

  it('should return ehrId with callback when ehrId cached', () => {
    const nhsNoMap = q.db.use('RippleNHSNoMap', ['byNHSNo', nhsNo, host]);
    nhsNoMap.value = '74b6a24b-bd97-47f0-ac6f-a632d0cac60f';

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session, callback);

    expect(callback).toHaveBeenCalledWith('74b6a24b-bd97-47f0-ac6f-a632d0cac60f');
  });

  it('should retrieve ehrId from openEHR server', (done) => {
    const data = {
      ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
    };

    httpEhrMock(data);

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      done();
    }, 100);
  });

  it('should return ehrId with callback', (done) => {
    const data = {
      ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
    };

    httpEhrMock(data);

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith('74b6a24b-bd97-47f0-ac6f-a632d0cac60f');

      done();
    }, 100);
  });

  it('should insert map values to db', (done) => {
    const data = {
      ehrId: '74b6a24b-bd97-47f0-ac6f-a632d0cac60f'
    };

    httpEhrMock(data);

    openEHR.init.call(q);
    mapNHSNoByHost.call(q, nhsNo, host, session, callback);

    setTimeout(() => {
      const nhsNoMap = q.db.use('RippleNHSNoMap', ['byNHSNo', nhsNo, host]);
      expect(nhsNoMap.value).toBe(data.ehrId);

      const mapByEhrId = q.db.use('RippleNHSNoMap', ['byEhrId', data.ehrId, host]);
      expect(mapByEhrId.value).toBe(nhsNo);

      done();
    }, 100);
  });
});
