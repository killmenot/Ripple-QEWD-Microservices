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
const getUser = require('../../../lib/handlers/getUser');
const data = require('../../support/patients.json');

describe('ripple-mpi/lib/handlers/getUser', () => {
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
        nhsNumber: 9999999000
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
      /*jshint camelcase: false */
      args.session = {
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.org',
        role: 'IDCR'
      };
      /*jshint camelcase: true */

      qewdSession.data.delete();
    });

    it('should create patient list in QEWD session', () => {
      const expected = {
        '07881112222': '07881112222',
        '9999999000': 9999999000,
        '9999999001': 9999999001,
        '9999999002': 9999999002,
        '9999999003': 9999999003,
        '9999999093': 9999999093
     };

      getUser.call(q, args, finished);

      const actual = qewdSession.data.$('patientList').getDocument();
      expect(actual).toEqual(expected);
    });

    it('should return data', () => {
      getUser.call(q, args, finished);

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.org',
        tenant: '',
        role: 'IDCR',
        roles: ['IDCR']
      });
      /*jshint camelcase: true */
    });
  });

  it('should return no such nhs number error', () => {
    args.session.nhsNumber = '1234567890';

    getUser.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'No such NHS Number: 1234567890'
    });
  });

  it('should return you have no access to this patien error', () => {
    args.session = {
      nhsNumber: '07881112222',
      role: 'IDCR'
    };

    getUser.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'You have no access to this patient'
    });
  });

  describe('openid', () => {
    beforeEach(() => {
      args.session.openid = {
        sub: 'google-oauth2|77778888999900011112'
      };
    });

    it('should return data when role is phrUser', () => {
      args.session.role = 'phrUser';

      getUser.call(q, args, finished);

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        sub: 'google-oauth2|77778888999900011112',
        given_name: 'Ivor',
        family_name: 'Cox',
        email: '',
        tenant: '',
        role: 'PHR',
        roles: ['PHR'],
        nhsNumber: 9999999000
      });
      /*jshint camelcase: true */
    });

    it('should return data when role is IDCR', () => {
      args.session.role = 'IDCR';

      getUser.call(q, args, finished);

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        sub: 'google-oauth2|77778888999900011112',
        given_name: 'Ivor',
        family_name: 'Cox',
        email: '',
        tenant: '',
        role: 'IDCR',
        roles: ['IDCR'],
        nhsNumber: 9999999000
      });
      /*jshint camelcase: true */
    });
  });

  describe('auth0', () => {
    beforeEach(() => {
      /*jshint camelcase: false */
      args.session.auth0 = {
        sub: 'google-oauth2|11112222333344455556',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.org'
      };
      /*jshint camelcase: true */
    });

    it('should return data when role is phrUser', () => {
      args.session.role = 'phrUser';

      getUser.call(q, args, finished);

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        sub: 'google-oauth2|11112222333344455556',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.org',
        tenant: '',
        role: 'PHR',
        roles: ['PHR'],
        nhsNumber: 9999999000
      });
      /*jshint camelcase: true */
    });

    it('should return data when role is IDCR', () => {
      args.session.role = 'IDCR';

      getUser.call(q, args, finished);

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        sub: 'google-oauth2|11112222333344455556',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.org',
        tenant: '',
        role: 'IDCR',
        roles: ['IDCR'],
        nhsNumber: 9999999000
      });
      /*jshint camelcase: true */
    });
  });
});
