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

  28 November 2018

*/

'use strict';

const Worker = require('../../mocks/worker');
const mockery = require('mockery');

describe('ripple-cdr-discovery/lib/src/cacheHeadingResources', () => {
  let cacheHeadingResources;

  let getResource;
  let getPractitionerOrganisations;

  let q;
  let args;
  let qewdSession;
  let callback;

  beforeAll(() => {
    mockery.enable({
      warnOnUnregistered: false
    });
  });

  afterEach(() => {
    mockery.deregisterAll();
  });

  afterAll(() => {
    mockery.disable();
  });


  beforeEach(() => {
    q = new Worker();
    args = {
      nhsNumber: 5558526785,
      session: q.sessions.create('app'),
      resourceName: 'Patient',
      token: 'some-jwt-token',
      dataArray: {
        entry: [
          {
            resource: {
              id: 585848485,
              name: 'PatientNameFoo',
              resourceType: 'Patient',
              careProvider: [
                {
                  reference: 'Practitioner'
                },
                {
                  reference: 'NotPractitioner'
                }
              ],
            }
          },
          {
            resource: {
              id: 585848485,
              name: 'PatientNameFoo',
              resourceType: 'Patient',
              patient: {
                reference: null
              },
              informationSource: {
                reference: null
              },
              recorder: {
                reference: null
              },
              asserter: {
                reference: null
              },
              careProvider: [
                {
                  reference: 'Practitioner'
                },
                {
                  reference: 'NotPractitioner'
                }
              ],
              performer: {
                reference: null
              }
            }
          },
          {
            resource: {
              id: 585848485,
              name: 'PatientNameFoo',
              resourceType: 'Patient',
              patient: {
                reference: 'patient/585848485/reference'
              },
              informationSource: {
                reference: 'some-informationSource'
              },
              recorder: {
                reference: 'some-recorder'
              },
              asserter: {
                reference: 'some-asserter'
              },
              careProvider: [
                {
                  reference: 'Practitioner'
                },
                {
                  reference: 'NotPractitioner'
                }
              ],
              performer: {
                reference: 'some-performer'
              }
            }
          },
          {
            resource: {
              id: 585848484,
              name: 'PatientNameBar',
              resourceType: 'NotPatient',
              patient: {
                reference: 'patient/585848485/reference'
              },
              informationSource: {
                reference: 'some-informationSource'
              },
              recorder: {
                reference: 'some-recorder'
              },
              asserter: {
                reference: 'some-asserter'
              },
              careProvider: [
                {
                  reference: 'Practitioner'
                },
                {
                  reference: 'NotPractitioner'
                }
              ],
              performer: {
                reference: 'some-performer'
              }
            }
          },
        ]
      }
    };

    callback = jasmine.createSpy();

    getResource = jasmine.createSpy();
    mockery.registerMock('./getResource', getResource);

    getPractitionerOrganisations = jasmine.createSpy();
    mockery.registerMock('./getPractitionerOrganisations', getPractitionerOrganisations);

    delete require.cache[require.resolve('../../../lib/src/cacheHeadingResources')];
    cacheHeadingResources = require('../../../lib/src/cacheHeadingResources');

    qewdSession = args.session;
  });

  it('should call cacheHeadingResources', () => {
    cacheHeadingResources.call(q, args.dataArray.entry, args.resourceName, args.token, qewdSession, callback);
  });

  it('should call patient with wrong resourceName', () => {
    cacheHeadingResources.call(q, args.dataArray.entry, 'NotPatient', args.token, qewdSession, callback);
  });

  it('should call getResource with error', () => {
    getResource.and.callFake((practitionerRef, token, session, callback) => callback('error'));
    cacheHeadingResources.call(q, args.dataArray.entry, 'NotPatient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalledWith('error');
  });

  it('should call getResource with empty response', () => {
    getResource.and.callFake((practitionerRef, token, session, callback) => callback(null,''));
    cacheHeadingResources.call(q, args.dataArray.entry, 'NotPatient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should return callback with empty data', () => {
    getResource.and.callFake((practitionerRef, token, session, callback) => callback(null, {}));
    cacheHeadingResources.call(q, args.dataArray.entry, 'NotPatient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should call getPractitionerOrganisations with error', () => {
    getResource.and.callFake((practitionerRef, token, session, callback) => callback(null , {
      resource: 'resource-data'
    }));
    getPractitionerOrganisations.and.callFake((resource, resourceName, token, session, callback) => callback('error'));
    cacheHeadingResources.call(q, args.dataArray.entry, 'NotPatient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should call getPractitionerOrganisations with success response', () => {
    getResource.and.callFake((practitionerRef, token, session, callback) => callback(null, {
      resource: 'some-resource-data'
    }));
    getPractitionerOrganisations.and.callFake((resource, resourceName, token, session, callback) => callback());
    cacheHeadingResources.call(q, args.dataArray.entry, 'NotPatient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should call cacheHeadingResources', () => {
    args.dataArray.entry = [
      {
        resource: {
          id: 585848485,
          name: 'PatientNameFoo',
          resourceType: 'Patient',
          careProvider: []
        }
      }
    ];
    cacheHeadingResources.call(q, args.dataArray.entry, args.resourceName, args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should be different names in resources', () => {
    args.dataArray.entry = [
      {
        resource: {
          id: 585848485,
          name: 'PatientNameFoo',
          resourceType: 'Doctor',
          careProvider: []
        }
      }
    ];
    cacheHeadingResources.call(q, args.dataArray.entry, args.resourceName, args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  })

});
