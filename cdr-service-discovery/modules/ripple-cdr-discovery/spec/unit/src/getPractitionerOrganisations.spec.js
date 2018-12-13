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

const mockery = require('mockery');
const Worker = require('../../mocks/worker');

describe('ripple-cdr-discovery/lib/src/getPractitionerOrganisations', () => {

  let getPractitionerOrganisations;

  let getResource;

  let q;
  let callback;
  let args;
  let qewdSession;

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
      practitionerResource: {
        practitionerRole: [
          {
            role: 'admin',
            managingOrganization: {
              reference: 'some-reference'
            }
          },
          {
            role: 'patient',
            managingOrganization: {
              reference: 'some-reference'
            }
          },
          {
            role: 'user',
            managingOrganization: {
              reference: 'some-reference'
            }
          }
        ]
      },
      token: 'some-token',
      resourceName: 'resource',
      session: q.sessions.create('app'),
    };

    callback = jasmine.createSpy();

    getResource = jasmine.createSpy();
    mockery.registerMock('./getResource', getResource);

    delete require.cache[require.resolve('../../../lib/src/getPractitionerOrganisations')];
    getPractitionerOrganisations = require('../../../lib/src/getPractitionerOrganisations');
    qewdSession = args.session;
  });

  it('should call getPractitionerOrganisations', () => {
    getResource.and.callFake((organisationRef, token, session, callback) => {
      callback('some-error');
    });
    getPractitionerOrganisations.call(q, args.practitionerResource, args.resourceName, args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalledWith('some-error')
  });

  it('should call getResources', () => {
    getResource.and.callFake((organisationRef, token, session, success) => success(null, {
      extension: [
        {
          valueReference: 'value-foo',
          reference: 'reference-foo'
        },
        {
          valueReference: 'value-bar',
          reference: 'reference-bar'
        }
      ]
    }));
    getPractitionerOrganisations.call(q, args.practitionerResource, 'Patient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should call getResource without resources', () => {
    getResource.and.callFake((organisationRef, token, session, success) => success(null, {}));
    getPractitionerOrganisations.call(q, args.practitionerResource, 'Patient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should call getResource with wrong resourceName', () => {
    getResource.and.callFake((organisationRef, token, session, success) => success());
    getPractitionerOrganisations.call(q, args.practitionerResource, 'WrongPatient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  });

  it('should call getResource with empty extensions', () => {
    getResource.and.callFake((organisationRef, token, session, success) => success(null, {
      extension: []
    }));
    getPractitionerOrganisations.call(q, args.practitionerResource, 'Patient', args.token, qewdSession, callback);
    expect(callback).toHaveBeenCalled();
  })

});
