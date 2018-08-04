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

  3 August 2018

*/

'use strict';

const Worker = require('../../mocks/worker');
const advancedSearch = require('../../../lib/handlers/advancedSearch');
const data = require('../../support/patients.json');

describe('ripple-mpi/lib/handlers/advancedSearch', () => {
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
      '9999999001',
      '9999999002',
      '9999999003',
      '9999999093'
    ].forEach(patientId => {
      qewdSession.data.$(['patientList', patientId]).value = patientId;
    });
  }

  beforeEach(() => {
    q = new Worker();

    args = {
      req: {
        qewdSession: q.sessions.create('app'),
        body: {
          forename: 'Ivor',
          surname: 'Cox'
        }
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

  it('should return you do not have access error', () => {
    args.session.role = 'phrUser';

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'You do not have access to this API'
    });
  });

  describe('nhsNumber', () => {
    beforeEach(() => {
      args.req.body = {
        nhsNumber: '9999999000'
      };
    });

    it('should return invalid nhs number error', () => {
      args.req.body.nhsNumber = '1234567890';

      advancedSearch.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid NHS Number'
      });
    });

    it('should return do not have access to this NHS number error', () => {
      args.req.body.nhsNumber = '07881112222';

      advancedSearch.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You do not have access to this NHS Number'
      });
    });

    it('should return data', () => {
      advancedSearch.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith([
        {
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
        }
      ]);
    });
  });

  it('should return missing or invalid surname', () => {
    delete args.req.body.surname;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Missing or invalid surname'
    });
  });

  it('should return missing or invalid forename', () => {
    delete args.req.body.forename;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Missing or invalid forename'
    });
  });

  it('should return matched patients', () => {
    const expected = [
      {
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
      {
        address: 'Ap #126-6226 Mi. St., Oakham, Rutland, XM9 4RF',
        dateOfBirth: -806976000000,
        department: 'Neighbourhood',
        gender: 'Male',
        gpAddress: 'Northmapton Practice, 616-9384 Mauris Rd., Northampton, Northamptonshire, ZY9 2KM',
        gpName: 'Cash Claire F.',
        id: 9999999001,
        name: 'Ivor Cox',
        nhsNumber: 9999999001,
        pasNo: 623454,
        phone: '(0112) 740 5408'
      },
      {
        address: '44, Mallow View, Limerick, LK',
        dateOfBirth: 816652800000,
        department: 'Mental Health',
        gender: 'Female',
        gpAddress: 'Taunton Practice, 611-682 Sed Road, Taunton, Somerset, Y92 1WA',
        gpName: 'Best Sylvia U.',
        id: 9999999093,
        name: 'Ivor Cox',
        nhsNumber: 9999999093,
        pasNo: 843147,
        phone: '076 2969 2315'
      }
    ];

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });

  it('should return matched patients when dateOfBirth passed', () => {
    const expected = [
      {
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
      {
        address: 'Ap #126-6226 Mi. St., Oakham, Rutland, XM9 4RF',
        dateOfBirth: -806976000000,
        department: 'Neighbourhood',
        gender: 'Male',
        gpAddress: 'Northmapton Practice, 616-9384 Mauris Rd., Northampton, Northamptonshire, ZY9 2KM',
        gpName: 'Cash Claire F.',
        id: 9999999001,
        name: 'Ivor Cox',
        nhsNumber: 9999999001,
        pasNo: 623454,
        phone: '(0112) 740 5408'
      }
    ];

    args.req.body.dateOfBirth = -806976000000;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });

  it('should return matched patients when minValue/maxValue passed', () => {
    const expected = [
      {
        address: '44, Mallow View, Limerick, LK',
        dateOfBirth: 816652800000,
        department: 'Mental Health',
        gender: 'Female',
        gpAddress: 'Taunton Practice, 611-682 Sed Road, Taunton, Somerset, Y92 1WA',
        gpName: 'Best Sylvia U.',
        id: 9999999093,
        name: 'Ivor Cox',
        nhsNumber: 9999999093,
        pasNo: 843147,
        phone: '076 2969 2315'
      }
    ];

    const now = new Date();
    const nowYear = now.getFullYear();

    // patients born in range 1990 - 2000
    args.req.body.minValue = nowYear - 2000;
    args.req.body.maxValue = nowYear - 1990;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });

  it('should return matched patients when sexFemale passed', () => {
    const expected = [
      {
        address: '44, Mallow View, Limerick, LK',
        dateOfBirth: 816652800000,
        department: 'Mental Health',
        gender: 'Female',
        gpAddress: 'Taunton Practice, 611-682 Sed Road, Taunton, Somerset, Y92 1WA',
        gpName: 'Best Sylvia U.',
        id: 9999999093,
        name: 'Ivor Cox',
        nhsNumber: 9999999093,
        pasNo: 843147,
        phone: '076 2969 2315'
      }
    ];

    args.req.body.sexFemale = true;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });

  it('should return matched patients when sexMale passed', () => {
    const expected = [
      {
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
      {
        address: 'Ap #126-6226 Mi. St., Oakham, Rutland, XM9 4RF',
        dateOfBirth: -806976000000,
        department: 'Neighbourhood',
        gender: 'Male',
        gpAddress: 'Northmapton Practice, 616-9384 Mauris Rd., Northampton, Northamptonshire, ZY9 2KM',
        gpName: 'Cash Claire F.',
        id: 9999999001,
        name: 'Ivor Cox',
        nhsNumber: 9999999001,
        pasNo: 623454,
        phone: '(0112) 740 5408'
      }
    ];

    args.req.body.sexMale = true;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });

  it('should return matched patients when both sexFemale/sexMale passed', () => {
    const expected = [
      {
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
      {
        address: 'Ap #126-6226 Mi. St., Oakham, Rutland, XM9 4RF',
        dateOfBirth: -806976000000,
        department: 'Neighbourhood',
        gender: 'Male',
        gpAddress: 'Northmapton Practice, 616-9384 Mauris Rd., Northampton, Northamptonshire, ZY9 2KM',
        gpName: 'Cash Claire F.',
        id: 9999999001,
        name: 'Ivor Cox',
        nhsNumber: 9999999001,
        pasNo: 623454,
        phone: '(0112) 740 5408'
      },
      {
        address: '44, Mallow View, Limerick, LK',
        dateOfBirth: 816652800000,
        department: 'Mental Health',
        gender: 'Female',
        gpAddress: 'Taunton Practice, 611-682 Sed Road, Taunton, Somerset, Y92 1WA',
        gpName: 'Best Sylvia U.',
        id: 9999999093,
        name: 'Ivor Cox',
        nhsNumber: 9999999093,
        pasNo: 843147,
        phone: '076 2969 2315'
      }
    ];

    args.req.body.sexFemale = true;
    args.req.body.sexMale = true;

    advancedSearch.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });
});
