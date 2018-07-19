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

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/deletePatientHeading', () => {
  let deletePatientHeading;

  let q;
  let args;
  let finished;

  let deleteHeading;
  let fetchAndCacheHeading;

  let qewdSession;

  function seeds() {
    // сompositionId not found for sourceId
    qewdSession.data.$(['headings', 'bySourceId', 'ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee']).setDocument({
      host: 'ethercis',
      uid: ''
    });

    // correct record
    const sourceId = 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d';
    const r = {
      host: 'marand',
      uid: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
      patientId: 9999999000,
      heading: 'procedures',
      date: 1514764800000
    };
    qewdSession.data.$(['headings', 'bySourceId', sourceId]).setDocument(r);
    qewdSession.data.$(['headings', 'byHeading', r.heading, sourceId]).value = '';
    qewdSession.data.$(['headings', 'byPatientId', r.patientId, r.heading, 'byDate', r.date, sourceId]).value = '';
    qewdSession.data.$(['headings', 'byPatientId', r.patientId, r.heading, 'byHost', r.host, sourceId]).value = '';
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

    args = {
      patientId: 9999999000,
      sourceId: 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d',
      heading: 'procedures',
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        userMode: 'admin',
        role: 'IDCR'
      }
    };
    finished = jasmine.createSpy();

    deleteHeading = jasmine.createSpy();
    mockery.registerMock('../src/deleteHeading', deleteHeading);

    fetchAndCacheHeading = jasmine.createSpy();
    mockery.registerMock('../src/fetchAndCacheHeading', fetchAndCacheHeading);

    delete require.cache[require.resolve('../../../lib/handlers/deletePatientHeading')];
    deletePatientHeading = require('../../../lib/handlers/deletePatientHeading');

    qewdSession = args.req.qewdSession;
    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid request error', () => {
    args.session.userMode = 'idcr';

    deletePatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid request'
    });
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    deletePatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return cannot delete feeds records error', () => {
    args.heading = 'feeds';

    deletePatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Cannot delete feeds records'
    });
  });

  it('should return cannot delete top3Things records error', () => {
    args.heading = 'top3Things';

    deletePatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Cannot delete top3Things records'
    });
  });

  it('should return invalid or missing heading error', () => {
    args.heading = 'bar';

    deletePatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid or missing heading: bar'
    });
  });

  it('should return no resuts could be returned error', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: false});
    });

    deletePatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'No results could be returned from the OpenEHR servers for heading procedures'
    });
  });

  it('should return no existing heading record found for sourceId error', () => {
    args.sourceId = 'ethercis-foobar';

    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });

    deletePatientHeading.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith({
      error: 'No existing procedures record found for sourceId: ethercis-foobar'
    });
  });

  it('should return сompositionId not found for sourceId error', () => {
    args.sourceId = 'ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee';

    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });

    deletePatientHeading.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith({
      error: 'Composition Id not found for sourceId: ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee'
    });
  });

  it('should delete patient heading', () => {
    fetchAndCacheHeading.and.callFake((patientId, heading, session, callback) => {
      callback({ok: true});
    });
    deleteHeading.and.callFake((patientId, heading, compositionId, host, session, callback) => callback({
      deleted: true,
      patientId: patientId,
      heading: heading,
      compositionId: compositionId,
      host: host
    }));

    deletePatientHeading.call(q, args, finished);

    expect(fetchAndCacheHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', qewdSession, jasmine.any(Function)
    );
    expect(deleteHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', '0f7192e9-168e-4dea-812a-3e1d236ae46d', 'marand', qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith({
      deleted: true,
      patientId: 9999999000,
      heading: 'procedures',
      compositionId: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
      host: 'marand'
    });

    [
      ['headings', 'bySourceId', 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d'],
      ['headings', 'byHeading', 'procedures'],
      ['headings', 'byPatientId', '9999999000', 'procedures']
    ].forEach(subs => {
      expect(qewdSession.data.$(subs).getDocument()).toEqual({});
    });
  });
});
