/*

 ----------------------------------------------------------------------------
 | ripple-openehr-jumper: Automated OpenEHR Template Access                 |
 |                                                                          |
 | Copyright (c) 2016-18 Ripple Foundation Community Interest Company       |
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

  22 July 2018

*/

'use strict';

const path = require('path');
const mockery = require('mockery');
const Worker = require('../mocks/worker');

describe('ripple-openehr-jumper/lib/postHeading', () => {
  let postHeading;
  let sendHeadingToOpenEHR;

  let q;
  let params;
  let callback;

  function rewritePaths(q) {
    /*jshint camelcase: false */
    q.userDefined.paths.jumper_templates = path.join(__dirname, '../templates/');
    q.userDefined.paths.openEHR_modules = '../../ripple-cdr-openehr/lib/src/';
    /*jshint camelcase: true */
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

    /*jshint camelcase: false */
    params = {
      patientId: 9999999000,
      heading: 'allergies',
      data: {
        data: {
          allergies_and_adverse_reactions: {
            adverse_reaction_risk: {
              comment: {
                value: 'History unclear'
              }
            }
          }
        }
      },
      qewdSession: q.sessions.create('app'),
      defaultHost: 'ethercis',
      method: 'post'
    };
    /*jshint camelcase: true */
    callback = jasmine.createSpy();

    sendHeadingToOpenEHR = jasmine.createSpy();
    mockery.registerMock('./sendHeadingToOpenEHR', sendHeadingToOpenEHR);

    delete require.cache[require.resolve('../../lib/postHeading')];
    postHeading = require('../../lib/postHeading');

    rewritePaths(q);
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return schema validation error', () => {
    const errors = [
      'instance.allergies_and_adverse_reactions.adverse_reaction_risk.comment.value: does not meet minimum length of 1',
      'instance.allergies_and_adverse_reactions.adverse_reaction_risk.comment.code: does not meet minimum length of 1'
    ];

    /*jshint camelcase: false */
    params.data.data.allergies_and_adverse_reactions.adverse_reaction_risk.comment.value = '';
    params.data.data.allergies_and_adverse_reactions.adverse_reaction_risk.comment.code = '';
    /*jshint camelcase: true */

    postHeading.call(q, params, callback);

    expect(callback).toHaveBeenCalledWith({
      error: errors.join(';')
    });
  });

  it('should send heading to OpenEHR with correct flat json', () => {
    /*jshint camelcase: false */
    const expectedParams = {
      patientId: 9999999000,
      heading: 'allergies',
      data: {
        data: {
          patientId: 9999999000,
          source: 'ethercis',
          allergies_and_adverse_reactions: {
            adverse_reaction_risk: {
              comment: {}
            }
          }
        }
      },
      qewdSession: params.qewdSession,
      defaultHost: 'ethercis',
      method: 'post',
      flatJSON: {
        'ctx/composer_name': 'Dr Tony Shannon',
        'adverse_reaction_list/allergies_and_adverse_reactions/adverse_reaction_risk:0/comment': 'History unclear'
      }
    };
    /*jshint camelcase: true */

    postHeading.call(q, params, callback);

    expect(sendHeadingToOpenEHR).toHaveBeenCalledWithContext(q, expectedParams, callback);
  });

  describe('pulsetile', () => {
    beforeEach(() => {
      params.data = {
        format: 'pulsetile',
        data: {
          comment: 'quux'
        }
      };
    });

    it('should send heading to OpenEHR with correct flat json', () => {
      /*jshint camelcase: false */
      const expectedParams = {
        patientId: 9999999000,
        heading: 'allergies',
        data: {
          format: 'pulsetile',
          data: {
            comment: 'quux',
            patientId: 9999999000,
            source: 'ethercis',
          }
        },
        qewdSession: params.qewdSession,
        defaultHost: 'ethercis',
        method: 'post',
        flatJSON: {
          'ctx/composer_name': 'Dr Tony Shannon',
          'adverse_reaction_list/allergies_and_adverse_reactions/adverse_reaction_risk:0/comment': 'quux'
        }
      };
      /*jshint camelcase: true */

      postHeading.call(q, params, callback);

      expect(sendHeadingToOpenEHR).toHaveBeenCalledWithContext(q, expectedParams, callback);
    });

    it('should cache heading Pulsetile to OpenEHR', () => {
      postHeading.call(q, params, callback);

      /*jshint camelcase: false */
      const pulseToOpenEhrPath = path.join(q.userDefined.paths.jumper_templates, 'allergies/Pulsetile_to_OpenEHR.json');
      mockery.registerSubstitute(pulseToOpenEhrPath, 'baz');
      /*jshint camelcase: true */

      expect(() => {
        postHeading.call(q, params, callback);
        mockery.deregisterSubstitute(pulseToOpenEhrPath);
      }).not.toThrowError();
    });
  });

  it('should cache heading flat JSON template', () => {
    postHeading.call(q, params, callback);

    /*jshint camelcase: false */
    const flatJsonPath = path.join(q.userDefined.paths.jumper_templates, 'allergies/flatJSON_template.json');
    mockery.registerSubstitute(flatJsonPath, 'baz');
    /*jshint camelcase: true */

    expect(() => {
      postHeading.call(q, params, callback);
      mockery.deregisterSubstitute(flatJsonPath);
    }).not.toThrowError();
  });

  it('should cache heading schema', () => {
    postHeading.call(q, params, callback);

    /*jshint camelcase: false */
    const schemaPath = path.join(q.userDefined.paths.jumper_templates, 'allergies/schema.json');
    mockery.registerSubstitute(schemaPath, 'baz');
    /*jshint camelcase: true */

    expect(() => {
      postHeading.call(q, params, callback);
      mockery.deregisterSubstitute(schemaPath);
    }).not.toThrowError();
  });
});
