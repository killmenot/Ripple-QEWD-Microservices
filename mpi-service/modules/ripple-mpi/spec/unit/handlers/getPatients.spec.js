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
const getPatients = require('../../../lib/handlers/getPatients');
const data = require('../../support/patients.json');

describe('ripple-mpi/lib/handlers/getPatients', () => {
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
    [
      '9999999000',
      '9999999003'
    ].forEach(patientId => {
      qewdSession.data.$(['patientList', patientId]).value = patientId;
    });
  }

  beforeEach(() => {
    q = new Worker();

    args = {
      req: {
        qewdSession: q.sessions.create('app')
      },
      session: {
        role: 'IDCR'
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

  it('should return empty list when role is phr user', () => {
    args.session.role = 'phrUser';

    getPatients.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      patients: []
    });
  });

  it('should return patients', () => {
    getPatients.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      '9999999000': {
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
        phone: '(011981) 32362'
      },
      '9999999003': {
        address: '40, High Street, Dublin, D8',
        dateOfBirth: 318384000000,
        department: 'Neighbourhood',
        gender: 'Female',
        gpAddress: 'Newport Practice, Ap #491-7493 Donec Ave, Newport, Hampshire, JB48 4EL',
        gpName: 'Bailey Demetrius B.',
        id: 9999999003,
        name: 'Emma Gallagher',
        nhsNumber: 9999999003,
        pasNo: 332546,
        phone: '07624 647524'
      }
    });
  });
});
