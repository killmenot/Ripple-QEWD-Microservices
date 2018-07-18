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

  18 July 2018

*/

'use strict';

const nock = require('nock');
const Worker = require('../../mocks/worker');
const openEHR = require('../../../lib/src/openEHR');
const putHeadingData = require('../../../lib/src/putHeadingData');

describe('ripple-cdr-openehr/lib/src/putHeadingData', () => {
  let q;
  let params;
  let callback;

  function httpMock(data) {
    nock('https://test.operon.systems')
      .put('/rest/v1/composition/0f7192e9-168e-4dea-812a-3e1d236ae46d', {
        'ctx/composer_name': 'Dr Tony Shannon',
        'foo/note': 'quux'
      })
      .query({
        templateId: 'IDCR - Procedures List.v1',
        format: 'FLAT'
      })
      .matchHeader('ehr-session', '61ee3e4e-b49e-431b-a34f-9f1fe6702b86')
      .reply(200, data);
  }

  beforeEach(() => {
    q = new Worker();

    callback = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should send request to put heading data to openEHR server', (done) => {
    /*jshint camelcase: false */
    params = {
      compositionId: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
      headingPostMap: {
        templateId: 'IDCR - Procedures List.v1',
        transformTemplate: {
          ctx: {
            composer_name: '=> either(author, "Dr Tony Shannon")',
          },
          foo: {
            note: '{{notes}}'
          }
        },
      },
      host: 'marand',
      data: {
        notes: 'quux'
      },
      openEhrSessionId: '61ee3e4e-b49e-431b-a34f-9f1fe6702b86'
    };
    /*jshint camelcase: true */

    const data = {
      baz: 'quux'
    };
    httpMock(data);

    openEHR.init.call(q);
    putHeadingData.call(q, params, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
        data: {
          baz: 'quux'
        }
      });

      done();
    }, 100);
  });
});
