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
const fs = require('fs-extra');
const rimraf = require('rimraf');
const mockery = require('mockery');
const fsMock = require('mock-fs');
const StatMode = require('stat-mode');
const Worker = require('../mocks/worker');
const buildJSONFileFn = require('../../lib/buildJsonFile');

describe('ripple-openehr-jumper/lib/build', () => {
  let build;

  let buildHeadingFHIRTemplate;
  let buildHeadingRippleTemplate;
  let buildJSONFile;
  let getWebTemplate;

  let q;
  let args;
  let finished;

  let dirname;

  /*jshint camelcase: false */
  const fakeResponses = {
    contacts: {
      template_name: 'Relevant Contacts List',
      composition_name: 'openEHR-EHR-COMPOSITION.health_summary.v1',
      metadata: []
    },
    problems: {
      template_name: 'Problem list',
      composition_name: 'openEHR-EHR-COMPOSITION.problem_list.v1',
      metadata: []
    }
  };
  /*jshint camelcase: true */

  function getWebTemplateFake(templateName, headingPath, callback) {
    const heading = path.basename(headingPath) + '';

    callback({
      ok: true,
      template: templateName,
      flatJSON: {
         'ctx/composer_name': '=> either(composer.value, \'Dr Tony Shannon\')',
      },
      metadata: fakeResponses[heading]
    });
  }

  function rewritePaths(q) {
    /*jshint camelcase: false */
    q.userDefined.paths.jumper_templates = path.join(__dirname, '../templates/');
    q.userDefined.paths.openEHR_modules = '../../ripple-cdr-openehr/lib/src/';
    /*jshint camelcase: true */
  }

  function validateNoBuildRun() {
    expect(buildHeadingRippleTemplate).not.toHaveBeenCalled();
    expect(buildHeadingFHIRTemplate).not.toHaveBeenCalled();
    expect(buildJSONFile).not.toHaveBeenCalled();
    expect(getWebTemplate).not.toHaveBeenCalled();
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

    args = {};
    finished = jasmine.createSpy();

    dirname = path.join(__dirname, '../../lib');

    buildHeadingFHIRTemplate = jasmine.createSpy();
    mockery.registerMock('./buildHeadingFHIRTemplate', buildHeadingFHIRTemplate);

    buildHeadingRippleTemplate = jasmine.createSpy();
    mockery.registerMock('./buildHeadingRippleTemplate', buildHeadingRippleTemplate);

    buildJSONFile = jasmine.createSpy().and.callFake(buildJSONFileFn);
    mockery.registerMock('./buildJsonFile', buildJSONFile);

    getWebTemplate = jasmine.createSpy().and.callFake(getWebTemplateFake);
    mockery.registerMock('./getWebTemplate', getWebTemplate);

    delete require.cache[require.resolve('../../lib/build')];
    build = require('../../lib/build');

    rewritePaths(q);
  });

  afterEach(() => {
    fsMock.restore();
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should not build heading when no template defined', () => {
    q.userDefined.headings = {
      procedures: true
    };

    build.call(q, args, finished);

    validateNoBuildRun();
    /*jshint camelcase: false */
    expect(finished).toHaveBeenCalledWith({
      dirname: dirname,
      headings_built: []
    });
    /*jshint camelcase: true */
  });

  it('should build heading when heading template folder is not created', () => {
    q.userDefined.headings = {
      problems: {
        template: {
          name: 'IDCR - Problem List.v1'
        },
        synopsisField: 'problem',
        summaryTableFields: ['problem', 'dateOfOnset']
      }
    };

    fsMock({
      'spec/templates': {}
    });

    build.call(q, args, finished);

    /*jshint camelcase: false */
    const headingPath = path.join(q.userDefined.paths.jumper_templates, 'problems');
    const headingPathStats = new StatMode(fs.statSync(headingPath));
    const statusJson = {status: 'locked'};
    /*jshint camelcase: true */

    expect(buildHeadingRippleTemplate).toHaveBeenCalledWith(headingPath);
    expect(buildHeadingFHIRTemplate).not.toHaveBeenCalled();

    expect(buildJSONFile).toHaveBeenCalledWithContext(q, statusJson, headingPath, 'headingStatus.json');
    expect(headingPathStats.toString()).toBe('drwxrwxrwx');

    expect(getWebTemplate).toHaveBeenCalledWithContext(q, 'IDCR - Problem List.v1', headingPath, jasmine.any(Function));

    /*jshint camelcase: false */
    expect(finished).toHaveBeenCalledWith({
      response: {
        problems: {
          ok: true,
          template: 'IDCR - Problem List.v1',
          flatJSON: {
            'ctx/composer_name': '=> either(composer.value, \'Dr Tony Shannon\')'
          },
          metadata: {
            template_name: 'Problem list',
            composition_name: 'openEHR-EHR-COMPOSITION.problem_list.v1',
            metadata: []
          }
        }
      },
      headings_built: [
        'problems'
      ]
    });
    /*jshint camelcase: true */
  });

  it('should build heading when heading status is not created', () => {
    q.userDefined.headings = {
      problems: {
        template: {
          name: 'IDCR - Problem List.v1'
        },
        synopsisField: 'problem',
        summaryTableFields: ['problem', 'dateOfOnset']
      }
    };

    fsMock({
      'spec/templates/problems': {}
    });

    build.call(q, args, finished);

    /*jshint camelcase: false */
    const headingPath = path.join(q.userDefined.paths.jumper_templates, 'problems');
    const headingPathStats = new StatMode(fs.statSync(headingPath));
    const statusJson = {status: 'locked'};
    /*jshint camelcase: true */

    expect(buildHeadingRippleTemplate).toHaveBeenCalledWith(headingPath);
    expect(buildHeadingFHIRTemplate).not.toHaveBeenCalled();

    expect(buildJSONFile).toHaveBeenCalledWithContext(q, statusJson, headingPath, 'headingStatus.json');
    expect(headingPathStats.toString()).toBe('drwxrwxrwx');

    expect(getWebTemplate).toHaveBeenCalledWithContext(q, 'IDCR - Problem List.v1', headingPath, jasmine.any(Function));

    /*jshint camelcase: false */
    expect(finished).toHaveBeenCalledWith({
      response: {
        problems: {
          ok: true,
          template: 'IDCR - Problem List.v1',
          flatJSON: {
            'ctx/composer_name': '=> either(composer.value, \'Dr Tony Shannon\')'
          },
          metadata: {
            template_name: 'Problem list',
            composition_name: 'openEHR-EHR-COMPOSITION.problem_list.v1',
            metadata: []
          }
        }
      },
      headings_built: [
        'problems'
      ]
    });
    /*jshint camelcase: true */
  });

  describe('locked', () => {
    it('should not build heading when heading status is "locked"', () => {
      q.userDefined.headings = {
        allergies: {
          template: {
            name: 'IDCR - Adverse Reaction List.v1'
          },
          synopsisField: 'cause',
          summaryTableFields: ['cause', 'reaction']
        }
      };

      build.call(q, args, finished);

      validateNoBuildRun();
      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        dirname: dirname,
        headings_built: []
      });
      /*jshint camelcase: true */
    });
  });

  describe('rebuild', () => {
    let headingPath;

    beforeEach(() => {
      q.userDefined.headings = {
        contacts: {
          template: {
            name: 'IDCR - Relevant contacts.v0'
          },
          synopsisField: 'name',
          summaryTableFields: ['name', 'relationship', 'nextOfKin']
        }
      };

      /*jshint camelcase: false */
      headingPath = path.join(q.userDefined.paths.jumper_templates, 'contacts');
      /*jshint camelcase: true */

      fs.ensureDirSync(headingPath);
      fs.chmodSync(headingPath, '0777');

      const statusJson = {status: 'rebuild'};
      buildJSONFileFn.call(q, statusJson, headingPath, 'headingStatus.json');
    });

    afterEach(() => {
      rimraf.sync(headingPath);
    });

    it('should build heading when heading status is "rebuild"', () => {
      build.call(q, args, finished);

      /*jshint camelcase: false */
      const headingPath = path.join(q.userDefined.paths.jumper_templates, 'contacts');
      const headingPathStats = new StatMode(fs.statSync(headingPath));
      const statusJson = {status: 'locked'};
      /*jshint camelcase: true */

      expect(buildHeadingRippleTemplate).toHaveBeenCalledWith(headingPath);
      expect(buildHeadingFHIRTemplate).not.toHaveBeenCalled();

      expect(buildJSONFile).toHaveBeenCalledWithContext(q, statusJson, headingPath, 'headingStatus.json');
      expect(headingPathStats.toString()).toBe('drwxrwxrwx');

      expect(getWebTemplate).toHaveBeenCalledWithContext(q, 'IDCR - Relevant contacts.v0', headingPath, jasmine.any(Function));

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        response: {
          contacts: {
            ok: true,
            template: 'IDCR - Relevant contacts.v0',
            flatJSON: {
              'ctx/composer_name': '=> either(composer.value, \'Dr Tony Shannon\')'
            },
            metadata: {
              template_name: 'Relevant Contacts List',
              composition_name: 'openEHR-EHR-COMPOSITION.health_summary.v1',
              metadata: []
            }
          }
        },
        headings_built: [
          'contacts'
        ]
      });
      /*jshint camelcase: true */
    });
  });

  describe('fhir', () => {
    beforeEach(() => {
      q.userDefined.headings = {
        problems: {
          template: {
            name: 'IDCR - Problem List.v1'
          },
          fhir: {
            name: 'Condition'
          },
          synopsisField: 'problem',
          summaryTableFields: ['problem', 'dateOfOnset']
        }
      };
    });

    it('should build heading when fhir templates', () => {
      fsMock({
        'spec/templates/problems': {}
      });

      build.call(q, args, finished);

      /*jshint camelcase: false */
      const headingPath = path.join(q.userDefined.paths.jumper_templates, 'problems');
      const headingPathStats = new StatMode(fs.statSync(headingPath));
      const statusJson = {status: 'locked'};
      /*jshint camelcase: true */

      expect(buildHeadingRippleTemplate).toHaveBeenCalledWith(headingPath);
      expect(buildHeadingFHIRTemplate).toHaveBeenCalledWith('Condition', headingPath);

      expect(buildJSONFile).toHaveBeenCalledWithContext(q, statusJson, headingPath, 'headingStatus.json');
      expect(headingPathStats.toString()).toBe('drwxrwxrwx');

      expect(getWebTemplate).toHaveBeenCalledWithContext(q, 'IDCR - Problem List.v1', headingPath, jasmine.any(Function));

      /*jshint camelcase: false */
      expect(finished).toHaveBeenCalledWith({
        response: {
          problems: {
            ok: true,
            template: 'IDCR - Problem List.v1',
            flatJSON: {
              'ctx/composer_name': '=> either(composer.value, \'Dr Tony Shannon\')'
            },
            metadata: {
              template_name: 'Problem list',
              composition_name: 'openEHR-EHR-COMPOSITION.problem_list.v1',
              metadata: []
            }
          }
        },
        headings_built: [
          'problems'
        ]
      });
      /*jshint camelcase: true */
    });
  });
});
