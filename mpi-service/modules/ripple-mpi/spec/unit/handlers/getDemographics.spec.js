/*

 ----------------------------------------------------------------------------
 | ripple-admin: Ripple User Administration MicroService                    |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  4 August 2018

*/

'use strict';

const Worker = require('../../mocks/worker');
const getDemographics = require('../../../lib/handlers/getDemographics');
const data = require('../../support/patients.json');

describe('ripple-mpi/lib/handlers/getDemographics', () => {
  let q;
  let args;
  let finished;
  let qewdSession;

  function seeds() {
    const phrPatients = q.db.use('RipplePHRPatients');
    phrPatients.$('byId').setDocument(data);
    Object.keys(data).forEach(id => {
      phrPatients.$(['byName', data[id].name, id]).value = id;
    });
  }

  function sessionSeeds() {
    qewdSession.data.$(['patientList', '9999999000']).value = '9999999000';
  }

  beforeEach(() => {
    q = new Worker();

    args = {
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        nhsNumber: 9999999000,
        role: 'phrUser'
      }
    };
    finished = jasmine.createSpy();

    qewdSession = args.req.qewdSession;

    seeds();
    sessionSeeds();
  });

  afterEach(() => {
    q.db.reset();
  });

  describe('IDCR', () => {
    beforeEach(() => {
      args.session = {
        role: 'IDCR'
      };
    });

    it('should return you have no access to this patient error', () => {
      args.patientId = '07881112222';

      getDemographics.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You have no access to this patient'
      });
    });

    it('should return demographics data', () => {
      args.patientId = '9999999000';

      getDemographics.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        demographics: {
          address: '6948 Et St., Halesowen, Worcestershire, VX27 5DV',
          dateOfBirth: -806976000000,
          department: 'Neighbourhood',
          gender: 'Male',
          gpAddress: 'Hamilton Practice, 5544 Ante Street, Hamilton, Lanarkshire, N06 5LP',
          gpName: 'Goff Carolyn D.',
          id: 9999999000,
          name: 'Ivor Cox',
          nhsNumber: 9999999000,
          pasNo: 352541,
          telephone: '(011981) 32362'
        }
      });
    });
  });

  it('should return patient id was not specified error', () => {
    delete args.session.nhsNumber;

    getDemographics.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Patient Id was not specified'
    });
  });

  it('should return no patient exists with that id error', () => {
    args.session.nhsNumber = 1234567890;

    getDemographics.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'No patient exists with that ID'
    });
  });

  it('should return demographics data', () => {
    getDemographics.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      demographics: {
        address: '6948 Et St., Halesowen, Worcestershire, VX27 5DV',
        dateOfBirth: -806976000000,
        department: 'Neighbourhood',
        gender: 'Male',
        gpAddress: 'Hamilton Practice, 5544 Ante Street, Hamilton, Lanarkshire, N06 5LP',
        gpName: 'Goff Carolyn D.',
        id: 9999999000,
        name: 'Ivor Cox',
        nhsNumber: 9999999000,
        pasNo: 352541,
        telephone: '(011981) 32362'
      }
    });
  });
});
