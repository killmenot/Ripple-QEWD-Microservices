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
const nock = require('nock');
const mockery = require('mockery');
const Worker = require('../mocks/worker');

describe('ripple-openehr-jumper/lib/getWebTemplate', () => {
  let getWebTemplate;
  let processWebTemplate;

  let q;
  let templateName;
  let headingPath;
  let callback;

  const fakeResponses = {
    session: {
      sessionId: '182bdb28-d257-4a99-9a41-441c49aead0c'
    }
  };
  const sessionId = fakeResponses.session.sessionId;

  function startSessionHttpMock(data) {
    nock('http://178.62.71.220:8080')
      .post('/rest/v1/session?username=bar&password=quux')
      .matchHeader('x-max-session', 75)
      .matchHeader('x-session-timeout', 120000)
      .reply(200, data || {});
  }

  function getTemplateHttpMock(sessionId, data, statusCode) {
    nock('http://178.62.71.220:8080')
      .get('/rest/v1/template/IDCR%20-%20Adverse%20Reaction%20List.v1/introspect')
      .matchHeader('ehr-session', sessionId)
      .reply(statusCode || 200, data || {});
  }

  function stopSessionHttpMock(sessionId, data) {
    nock('http://178.62.71.220:8080')
      .delete('/rest/v1/session')
      .matchHeader('ehr-session', sessionId)
      .reply(200, data || {});
  }


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

    rewritePaths(q);

    templateName = 'IDCR - Adverse Reaction List.v1';
    /*jshint camelcase: false */
    headingPath = path.join(q.userDefined.paths.jumper_templates, 'allergies');
    /*jshint camelcase: true */
    callback = jasmine.createSpy();

    processWebTemplate = jasmine.createSpy();
    mockery.registerMock('./processWebTemplate', processWebTemplate);

    delete require.cache[require.resolve('../../lib/getWebTemplate')];
    getWebTemplate = require('../../lib/getWebTemplate');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  it('should return template Name not defined or empty error', () => {
    templateName = '';

    getWebTemplate.call(q, templateName, headingPath, callback);

    expect(callback).toHaveBeenCalledWith({
      error: 'Template Name not defined or empty'
    });
  });

  it('should request web template and return developer message', (done) => {
    const data = {
      status: 404,
      developerMessage: 'Oops'
    };

    startSessionHttpMock(fakeResponses.session);
    getTemplateHttpMock(sessionId, data, 404);
    stopSessionHttpMock(sessionId);

    getWebTemplate.call(q, templateName, headingPath, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(callback).toHaveBeenCalledWith({
         error: 'Oops'
      });
      expect(processWebTemplate).not.toHaveBeenCalled();

      done();
    }, 100);
  });

  it('should request web template and process it', (done) => {
    const data = {
      foo: 'bar'
    };

    startSessionHttpMock(fakeResponses.session);
    getTemplateHttpMock(sessionId, data);
    stopSessionHttpMock(sessionId);

    processWebTemplate.and.returnValue({baz: 'quux'});

    getWebTemplate.call(q, templateName, headingPath, callback);

    setTimeout(() => {
      expect(nock).toHaveBeenDone();
      expect(processWebTemplate).toHaveBeenCalledWithContext(q, templateName, headingPath, data, 'ethercis');
      expect(callback).toHaveBeenCalledWith({baz: 'quux'});

      done();
    }, 100);
  });

  // describe('POST', () => {
  //   beforeEach(() => {
  //     params.method = 'post';
  //   });

  //   it('should return non ok', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPostHeadingMock(sessionId, ehrId, null);

  //     sendHeadingToOpenEHR.call(q, params);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();

  //       done();
  //     }, 100);
  //   });

  //   it('should return non ok with callback', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPostHeadingMock(sessionId, ehrId, null);

  //     sendHeadingToOpenEHR.call(q, params, callback);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();
  //       expect(callback).toHaveBeenCalledWith({
  //         ok: false
  //       });

  //       done();
  //     }, 100);
  //   });

  //   it('should send heading to OpenEHR and return correct response', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPostHeadingMock(sessionId, ehrId, fakeResponses.postHeading);

  //     sendHeadingToOpenEHR.call(q, params);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();

  //       done();
  //     }, 100);
  //   });

  //   it('should send heading to OpenEHR and return correct response with callback', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPostHeadingMock(sessionId, ehrId, fakeResponses.postHeading);

  //     sendHeadingToOpenEHR.call(q, params, callback);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();
  //       expect(callback).toHaveBeenCalledWith({
  //         ok: true,
  //         host: 'ethercis',
  //         heading: 'allergies',
  //         compositionUid: '61ee3e4e-b49e-431b-a34f-9f1fe6702b86'
  //       });

  //       done();
  //     }, 100);
  //   });
  // });

  // describe('PUT', () => {
  //   beforeEach(() => {
  //     params.method = 'put';
  //     params.compositionId = 'ae3886df-21e2-4249-97d6-d0612ae8f8be';
  //   });

  //   it('should return non ok', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPutHeadingMock(sessionId, ehrId, null);

  //     sendHeadingToOpenEHR.call(q, params);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();

  //       done();
  //     }, 100);
  //   });

  //   it('should return non ok with callback', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPutHeadingMock(sessionId, ehrId, null);

  //     sendHeadingToOpenEHR.call(q, params, callback);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();
  //       expect(callback).toHaveBeenCalledWith({
  //         ok: false
  //       });

  //       done();
  //     }, 100);
  //   });

  //   it('should send heading to OpenEHR and return correct response', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPutHeadingMock(sessionId, ehrId, fakeResponses.putHeading);

  //     sendHeadingToOpenEHR.call(q, params);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();

  //       done();
  //     }, 100);
  //   });

  //   it('should send heading to OpenEHR and return correct response with callback', (done) => {
  //     startSessionHttpMock(fakeResponses.session);
  //     httpEhrMock(sessionId, fakeResponses.ehr);
  //     httpPutHeadingMock(sessionId, ehrId, fakeResponses.putHeading);

  //     sendHeadingToOpenEHR.call(q, params, callback);

  //     setTimeout(() => {
  //       expect(nock).toHaveBeenDone();
  //       validateThatSessionCacheToBeDeleted();
  //       expect(callback).toHaveBeenCalledWith({
  //         ok: true,
  //         host: 'ethercis',
  //         heading: 'allergies',
  //         compositionUid: '22f95845-8387-4650-83bc-a5642bf26ca5'
  //       });

  //       done();
  //     }, 100);
  //   });
  // });
});
