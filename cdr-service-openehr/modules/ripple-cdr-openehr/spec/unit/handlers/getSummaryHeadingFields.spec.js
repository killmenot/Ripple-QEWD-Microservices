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

describe('ripple-cdr-openehr/lib/handlers/getSummaryHeadingFields', () => {
  let getSummaryHeadingFields;

  let q;
  let args;
  let finished;

  function headingsMocks() {
    mockery.registerMock('../headings/procedures', {
      name: 'procedures',
      textFieldName: 'name',
      headingTableFields: ['desc'],
      get: {
        transformTemplate: {
          name: '{{foo}}',
          desc: '{{bar}}'
        }
      }
    });
    // mockery.registerMock('../headings/vaccinations', {
    //   name: 'vaccinations',
    //   jumperFormatData: 'foobar'
    // });
    // mockery.registerMock('../headings/counts', {
    //   name: 'counts',
    //   textFieldName: 'name',
    //   headingTableFields: ['name', 'desc'],
    //   get: {
    //     transformTemplate: {}
    //   }
    // });
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
      heading: 'procedures',
      session: {
        userMode: 'admin'
      }
    };
    finished = jasmine.createSpy();

    delete require.cache[require.resolve('../../../lib/handlers/getSummaryHeadingFields')];
    getSummaryHeadingFields = require('../../../lib/handlers/getSummaryHeadingFields');

    headingsMocks();
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return invalid request error', () => {
    args.session.userMode = 'idcr';

    getSummaryHeadingFields.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid request'
    });
  });

  it('should return feeds records are not maintained error', () => {
    args.heading = 'feeds';

    getSummaryHeadingFields.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'feeds records are not maintained on OpenEHR'
    });
  });

  it('should return top3Things records are not maintained error', () => {
    args.heading = 'top3Things';

    getSummaryHeadingFields.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'top3Things records are not maintained on OpenEHR'
    });
  });

  it('should return invalid or missing heading error', () => {
    args.heading = 'bar';

    getSummaryHeadingFields.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid or missing heading: bar'
    });
  });

  it('should return summary heading fields from heading definition', () => {
    getSummaryHeadingFields.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(['desc']);
  });

  it('should return summary heading fields from config', () => {
    args.heading = 'vaccinations';

    getSummaryHeadingFields.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(['vaccinationName', 'dateCreated']);
  });


});
