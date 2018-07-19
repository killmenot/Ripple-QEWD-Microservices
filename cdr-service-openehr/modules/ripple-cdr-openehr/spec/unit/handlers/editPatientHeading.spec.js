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

describe('ripple-cdr-openehr/lib/handlers/editPatientHeading', () => {
  let editPatientHeading;

  let q;
  let args;
  let finished;

  let putHeading;

  let qewdSession;

  function seeds() {
    qewdSession.data.$(['headings', 'bySourceId', 'ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee']).setDocument({
      host: 'ethercis',
      uid: ''
    });
    qewdSession.data.$(['headings', 'bySourceId', 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d']).setDocument({
      host: 'marand',
      uid: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
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

    args = {
      patientId: 9999999000,
      sourceId: 'marand-0f7192e9-168e-4dea-812a-3e1d236ae46d',
      heading: 'procedures',
      req: {
        qewdSession: q.sessions.create('app'),
        body: {
          foo: 'bar'
        }
      },
      session: {
        nhsNumber: 9434765919,
        role: 'IDCR'
      }
    };
    finished = jasmine.createSpy();

    putHeading = jasmine.createSpy();
    mockery.registerMock('../src/putHeading', putHeading);

    delete require.cache[require.resolve('../../../lib/handlers/editPatientHeading')];
    editPatientHeading = require('../../../lib/handlers/editPatientHeading');

    qewdSession = args.req.qewdSession;
    seeds();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    editPatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return invalid or missing heading error', () => {
    args.heading = 'bar';

    editPatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid or missing heading: bar'
    });
  });

  it('should return no existing heading record found for sourceId error', () => {
    args.sourceId = 'ethercis-foobar';

    editPatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'No existing procedures record found for sourceId: ethercis-foobar'
    });
  });

  it('should return сompositionId not found for sourceId error', () => {
    args.sourceId = 'ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee';

    editPatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Composition Id not found for sourceId: ethercis-e5770469-7c26-47f7-afe0-57bce80eb2ee'
    });
  });

  it('should return no body content was sent for heading error', () => {
    args.req.body = [];

    editPatientHeading.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'No body content was sent for heading procedures'
    });
  });

  it('should update patient heading', () => {
    putHeading.and.callFake((patientId, heading, compositionId, body, session, callback) => {
      callback({
        ok: true,
        host: 'marand',
        heading: heading,
        compositionUid: compositionId,
        action: 'quux'
      });
    });

    editPatientHeading.call(q, args, finished);

    expect(putHeading).toHaveBeenCalledWithContext(
      q, 9999999000, 'procedures', '0f7192e9-168e-4dea-812a-3e1d236ae46d', {foo: 'bar'}, qewdSession, jasmine.any(Function)
    );
    expect(finished).toHaveBeenCalledWith({
      ok: true,
      host: 'marand',
      heading: 'procedures',
      compositionUid: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
      action: 'quux'
    });
  });

  it('should override patientId for PHR users', () => {
    args.session.role = 'phrUser';

    putHeading.and.callFake((patientId, heading, compositionId, body, session, callback) => {
      callback({
        ok: true,
      });
    });

    editPatientHeading.call(q, args, finished);

    expect(putHeading).toHaveBeenCalledWithContext(
      q, 9434765919, 'procedures', '0f7192e9-168e-4dea-812a-3e1d236ae46d', {foo: 'bar'}, qewdSession, jasmine.any(Function)
    );
  });
});
