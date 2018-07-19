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

const Worker = require('../../mocks/worker');
const postTop3Things = require('../../../lib/top3Things/postTop3Things');

describe('ripple-cdr-openehr/lib/top3Things/postTop3Things', () => {
  let q;
  let args;
  let finished;

  beforeAll(() => {
    jasmine.clock().install();

    const nowTime = Date.UTC(2018, 0, 1); // 1514764800000, now
    jasmine.clock().mockDate(new Date(nowTime));
  });

  afterAll(() => {
    jasmine.clock().uninstall();
  });

  beforeEach(() => {
    q = new Worker();

    args = {
      patientId: 9999999000,
      req: {
        body: {
          name1: 'foo1',
          description1: 'baz1',
          name2: 'foo2',
          description2: 'baz2',
          name3: 'foo3',
          description3: 'baz3'
        }
      },
      session: {
        nhsNumber: 9434765919,
        role: 'IDCR'
      }
    };
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return invalid or missing patientId error', () => {
    args.patientId = 'foo';

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'patientId foo is invalid'
    });
  });

  it('should return must specify at least 1 top thing error when name1 missed', () => {
    delete args.req.body.name1;

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'You must specify at least 1 Top Thing'
    });
  });

  it('should return must specify at least 1 top thing error when description1 missed', () => {
    delete args.req.body.description1;

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'You must specify at least 1 Top Thing'
    });
  });

  it('should return description for the 2nd top thing was defined but its summary name was not defined error', () => {
    delete args.req.body.name2;

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'A Description for the 2nd Top Thing was defined, but its summary name was not defined'
    });
  });

  it('should return description for the 3rd top thing was defined but its summary name was not defined error', () => {
    delete args.req.body.name3;

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'A Description for the 3rd Top Thing was defined, but its summary name was not defined'
    });
  });

  it('should post top 3 things', () => {
    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      sourceId: jasmine.any(String)
    });

    const sourceId = finished.calls.argsFor(0)[0].sourceId;
    const top3Things = q.db.use('Top3Things');

    expect(top3Things.$(['bySourceId', sourceId]).getDocument()).toEqual({
      patientId: 9999999000,
      date: 1514764800000,
      data: {
        name1: 'foo1',
        description1: 'baz1',
        name2: 'foo2',
        description2: 'baz2',
        name3: 'foo3',
        description3: 'baz3'
      }
    });
    expect(top3Things.$(['byPatient', 9999999000, 'byDate', 1514764800000]).value).toBe(sourceId);
    expect(top3Things.$(['byPatient', 9999999000, 'latest']).value).toBe(sourceId);
  });

  it('should post top 3 things when 2nd thing is missed', () => {
    delete args.req.body.name2;
    delete args.req.body.description2;

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      sourceId: jasmine.any(String)
    });

    const sourceId = finished.calls.argsFor(0)[0].sourceId;
    const top3Things = q.db.use('Top3Things');

    expect(top3Things.$(['bySourceId', sourceId]).getDocument()).toEqual({
      patientId: 9999999000,
      date: 1514764800000,
      data: {
        name1: 'foo1',
        description1: 'baz1',
        name2: '',
        description2: '',
        name3: 'foo3',
        description3: 'baz3'
      }
    });
    expect(top3Things.$(['byPatient', 9999999000, 'byDate', 1514764800000]).value).toBe(sourceId);
    expect(top3Things.$(['byPatient', 9999999000, 'latest']).value).toBe(sourceId);
  });

  it('should post top 3 things when 3rd thing is missed', () => {
    delete args.req.body.name3;
    delete args.req.body.description3;

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      sourceId: jasmine.any(String)
    });

    const sourceId = finished.calls.argsFor(0)[0].sourceId;
    const top3Things = q.db.use('Top3Things');

    expect(top3Things.$(['bySourceId', sourceId]).getDocument()).toEqual({
      patientId: 9999999000,
      date: 1514764800000,
      data: {
        name1: 'foo1',
        description1: 'baz1',
        name2: 'foo2',
        description2: 'baz2',
        name3: '',
        description3: ''
      }
    });
    expect(top3Things.$(['byPatient', 9999999000, 'byDate', 1514764800000]).value).toBe(sourceId);
    expect(top3Things.$(['byPatient', 9999999000, 'latest']).value).toBe(sourceId);
  });

  it('should post top 3 things when patientId was overridden for PHR users', () => {
    args.session.role = 'phrUser';

    postTop3Things.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      sourceId: jasmine.any(String)
    });

    const sourceId = finished.calls.argsFor(0)[0].sourceId;
    const top3Things = q.db.use('Top3Things');

    expect(top3Things.$(['bySourceId', sourceId]).getDocument()).toEqual({
      patientId: 9434765919,
      date: 1514764800000,
      data: {
        name1: 'foo1',
        description1: 'baz1',
        name2: 'foo2',
        description2: 'baz2',
        name3: 'foo3',
        description3: 'baz3'
      }
    });
    expect(top3Things.$(['byPatient', 9434765919, 'byDate', 1514764800000]).value).toBe(sourceId);
    expect(top3Things.$(['byPatient', 9434765919, 'latest']).value).toBe(sourceId);
  });
});
