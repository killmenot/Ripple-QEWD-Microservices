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

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-openehr/lib/handlers/revertAllDiscoveryData', () => {
  let revertAllDiscoveryData;

  let q;
  let args;
  let finished;

  let qewdSession;
  let discoveryMap;

  let deletePatientHeading;

  function seeds() {
    discoveryMap.$(['by_discovery_sourceId']).setDocument({
      'eaf394a9-5e05-49c0-9c69-c710c77eda76': 'ethercis-bar',
      '2c9a7b22-4cdd-484e-a8b5-759a70443be3': 'ethercis-foo'
    });
    discoveryMap.$(['by_openehr_sourceId']).setDocument({
      'ethercis-foo': {
        discovery: 'eaf394a9-5e05-49c0-9c69-c710c77eda76',
        heading: 'procedures',
        openehr: 'foo::vm01.ethercis.org::1',
        patientId: 9999999000
      },
      'ethercis-bar': {
        discovery: '2c9a7b22-4cdd-484e-a8b5-759a70443be3',
        heading: 'contacts',
        openehr: 'bar::vm01.ethercis.org::1',
        patientId: 9999999111
      },
    })
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
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {}
    };
    finished = jasmine.createSpy();

    deletePatientHeading = jasmine.createSpy();
    mockery.registerMock('./deletePatientHeading', deletePatientHeading);

    delete require.cache[require.resolve('../../../lib/handlers/revertAllDiscoveryData')];
    revertAllDiscoveryData = require('../../../lib/handlers/revertAllDiscoveryData');

    qewdSession = args.req.qewdSession;
    discoveryMap = new q.documentStore.DocumentNode('DiscoveryMap');
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should revert all discovery data', (done) => {
    deletePatientHeading.and.callFake((args, callback) =>
      callback({
        deleted: true,
        patientId: args.patientId,
        heading: args.heading,
        compositionId: 'some.compositionId',
        host: 'ethercis'
      })
    );

    seeds();

    revertAllDiscoveryData.call(q, args, finished);

    setTimeout(() => {
      expect(deletePatientHeading).toHaveBeenCalledTimes(2);

      [
        ['11f87140-05f4-480a-a1d7-f4a2049dcf3', 'procedures'],
        ['2c9a7b22-4cdd-484e-a8b5-759a70443be3', 'contacts']
      ].forEach((data, i) => {
        const [ sourceId, heading ] = data;

        expect(deletePatientHeading.calls.thisArgFor(i)).toBe(q);
        expect(deletePatientHeading.calls.argsFor(i)).toEqual([args, jasmine.any(Function)]);
      });

      expect(discoveryMap.$(['by_discovery_sourceId']).getDocument()).toEqual({});
      expect(discoveryMap.$(['by_openehr_sourceId']).getDocument()).toEqual({});

      expect(finished).toHaveBeenCalledWith([
        {
          deleted: true,
          patientId: 9999999111,
          heading: 'contacts',
          compositionId: 'some.compositionId',
          host: 'ethercis'
        },
        {
          deleted: true,
          patientId: 9999999000,
          heading: 'procedures',
          compositionId: 'some.compositionId',
          host: 'ethercis'
        }
      ])

      done();
    }, 100);
  });

  it('should do nothing', () => {
    revertAllDiscoveryData.call(q, args, finished);

    expect(deletePatientHeading).not.toHaveBeenCalled();
    expect(finished).toHaveBeenCalledWith([]);
  });

  // it('should return refresh not needed when record not found discovery cache and no response from OpenEHR', (done) => {
  //   const sessionId = fakeResponses.session.sessionId;

  //   startSessionHttpMock(fakeResponses.session);
  //   httpEhrMock(sessionId, fakeResponses.ehr);

  //   args.req.data = [
  //     {
  //       sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
  //     }
  //   ];

  //   postHeading.and.callFake((patientId, heading, data, session, callback) => callback());

  //   mergeDiscoveryData.call(q, args, finished);

  //   setTimeout(() => {
  //     expect(nock).toHaveBeenDone();
  //     expect(postHeading).toHaveBeenCalledWithContext(q, 9999999000, 'procedures', {
  //       data: {
  //         sourceId: 'eaf394a9-5e05-49c0-9c69-c710c77eda76'
  //       },
  //       format: 'pulsetile',
  //       source: 'GP'
  //     }, qewdSession, jasmine.any(Function));
  //     expect(finished).toHaveBeenCalledWith({
  //       refresh: false
  //     });

  //     done();
  //   }, 100);
  // });
});
