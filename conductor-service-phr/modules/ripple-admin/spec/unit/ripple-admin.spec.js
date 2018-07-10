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

  3 July 2018

*/

'use strict';

const mockery = require('mockery');
const nock = require('nock');
const Worker = require('../mocks/worker');
const rippleAdmin = require('../../lib/ripple-admin');

describe('ripple-admin/lib/ripple-admin', () => {
  let q;
  let messageObj;
  let session;
  let send;
  let finished;

  beforeAll(() => {
    mockery.enable();
  });

  afterAll(() => {
    mockery.disable();
  });

  beforeEach(() => {
    q = new Worker();
    q.userDefined = {
      config: {},
      ripple: {
        homepage: 'http://dev.ripple.foundation:8010/index.html'
      },
      phr: {
        homepage: '/index.html'
      }
    };

    messageObj = {};
    session = {};
    send = jasmine.createSpy();
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    nock.cleanAll();
    mockery.deregisterAll();
  });

  describe('beforeHandler', () => {
    it('should not pass user must be authenticated error when user not authenticated', () => {
      const actual = rippleAdmin.beforeHandler.call(q, messageObj, session, send, finished);

      expect(actual).toBeFalsy();
      expect(finished).toHaveBeenCalledWith({
        error: 'User MUST be authenticated'
      });
    });

    it('should pass when messageObj type is loggedIn', () => {
      messageObj.type = 'loggedIn';

      const actual = rippleAdmin.beforeHandler.call(q, messageObj, session, send, finished);

      expect(actual).toBeUndefined();
      expect(finished).not.toHaveBeenCalled();
    });

    it('should pass when user authenticated', () => {
      session.authenticated = true;

      const actual = rippleAdmin.beforeHandler.call(q, messageObj, session, send, finished);

      expect(actual).toBeUndefined();
      expect(finished).not.toHaveBeenCalled();
    });
  });

  describe('handlers', () => {
    describe('#loggedIn', () => {
      beforeEach(() => {
        messageObj = {
          params: {
            jwt: 'jwt.token'
          }
        };

        session = {
          updateExpiry: jasmine.createSpy()
        };
      });

      it('should return non ok', () => {
        q.jwt.handlers.isJWTValid.and.returnValue({ok: false});

        rippleAdmin.handlers.loggedIn.call(q, messageObj, session, send, finished);

        expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWithContext(q, 'jwt.token');
        expect(session.timeout).toBe(1);
        expect(session.updateExpiry).toHaveBeenCalled();
        expect(session.authenticated).toBeFalsy();
        expect(finished).toHaveBeenCalledWith({ok: false});
      });

      it('should return ok', () => {
        q.jwt.handlers.isJWTValid.and.returnValue({ok: true});

        rippleAdmin.handlers.loggedIn.call(q, messageObj, session, send, finished);

        expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWithContext(q, 'jwt.token');
        expect(session.timeout).toBe(1200);
        expect(session.updateExpiry).toHaveBeenCalled();
        expect(session.authenticated).toBeTruthy();
        expect(finished).toHaveBeenCalledWith({ok: true});
      });
    });

    describe('#deleteHeading', () => {
      function httpMock(baseUrl) {
        const data = [
          { sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d' },
          { sourceId: '260a7be5-e00f-4b1e-ad58-27d95604d010' }
        ];

        nock(baseUrl)
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .reply(200, data);

        data.forEach((x) => {
          nock(baseUrl)
          .matchHeader('authorization', 'Bearer jwt.token')
          .delete(`/api/patients/9999999000/procedures/${x.sourceId}`)
          .reply(200, {});
        });
      }

      beforeEach(() => {
        q.jwt.handlers.isJWTValid.and.returnValue({ok: true});

        messageObj = {
          params: {
            jwt: 'jwt.token',
            patientId: '9999999000',
            heading: 'procedures'
          }
        };
      });

      it('should return invalid jwt error', () => {
        q.jwt.handlers.isJWTValid.and.returnValue({ok: false});

        rippleAdmin.handlers.deleteHeading.call(q, messageObj, session, send, finished);

        expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWithContext(q, 'jwt.token');
        expect(finished).toHaveBeenCalledWith({
          error: 'Invalid JWT'
        });
      });

      it('should return number of deleted records', (done) => {
        const baseUrl = 'http://localhost';
        httpMock(baseUrl);

        rippleAdmin.handlers.deleteHeading.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWithContext(q, 'jwt.token');
          expect(send).toHaveBeenCalledTimes(2);
          expect(send.calls.argsFor(0)[0]).toEqual({deleted: '0f7192e9-168e-4dea-812a-3e1d236ae46d'});
          expect(send.calls.argsFor(1)[0]).toEqual({deleted: '260a7be5-e00f-4b1e-ad58-27d95604d010'});
          expect(finished).toHaveBeenCalledWith({records: 2});

          done();
        }, 100);
      });

      it('should return number of deleted records when HTTPS enabled', (done) => {
        q.userDefined.config.ssl = true;

        const baseUrl = 'https://localhost';
        httpMock(baseUrl);

        rippleAdmin.handlers.deleteHeading.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWithContext(q, 'jwt.token');
          expect(send).toHaveBeenCalledTimes(2);
          expect(send.calls.argsFor(0)[0]).toEqual({deleted: '0f7192e9-168e-4dea-812a-3e1d236ae46d'});
          expect(send.calls.argsFor(1)[0]).toEqual({deleted: '260a7be5-e00f-4b1e-ad58-27d95604d010'});
          expect(finished).toHaveBeenCalledWith({records: 2});

          done();
        }, 100);
      });

      it('should return number of deleted records when custom port is set', (done) => {
        q.userDefined.config.port = 9090;

        const baseUrl = 'http://localhost:9090';
        httpMock(baseUrl);

        rippleAdmin.handlers.deleteHeading.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(q.jwt.handlers.isJWTValid).toHaveBeenCalledWithContext(q, 'jwt.token');
          expect(send).toHaveBeenCalledTimes(2);
          expect(send.calls.argsFor(0)[0]).toEqual({deleted: '0f7192e9-168e-4dea-812a-3e1d236ae46d'});
          expect(send.calls.argsFor(1)[0]).toEqual({deleted: '260a7be5-e00f-4b1e-ad58-27d95604d010'});
          expect(finished).toHaveBeenCalledWith({records: 2});

          done();
        }, 100);
      });
    });

    describe('#getHomePageURLs', () => {
      it('should return empty home page URLs', () => {
        delete q.userDefined.ripple;
        delete q.userDefined.phr;

        rippleAdmin.handlers.getHomePageURLs.call(q, messageObj, session, send, finished);

        expect(send).not.toHaveBeenCalled();
        expect(finished).toHaveBeenCalledWith({
          ripple: '',
          phr: ''
        });
      });

      it('should return home page URLs', () => {
        rippleAdmin.handlers.getHomePageURLs.call(q, messageObj, session, send, finished);

        expect(send).not.toHaveBeenCalled();
        expect(finished).toHaveBeenCalledWith({
          ripple: 'http://dev.ripple.foundation:8010/index.html',
          phr: '/index.html'
        });
      });
    });

    describe('#populatePatient', () => {
      function httpMock(baseUrl, dataFn, ignoreSecondCall) {
        // first call
        nock(baseUrl)
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .once()
          .reply(200, dataFn(0));

        nock(baseUrl)
          .matchHeader('authorization', 'Bearer jwt.token')
          .post('/api/patients/9999999000/procedures?format=openehr-jumper', {
            foo: 'bar'
          })
          .reply(200);
        nock(baseUrl)
          .matchHeader('authorization', 'Bearer jwt.token')
          .post('/api/patients/9999999000/procedures?format=openehr-jumper', {
            quux: 'baz'
          })
          .reply(200);

        // second call
        if (!ignoreSecondCall) {
          nock(baseUrl)
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .once()
          .reply(200, dataFn(1));
        }
      }

      beforeEach(() => {
        messageObj = {
          params: {
            patientId: '9999999000',
            heading: 'procedures',
            jwt: 'jwt.token'
          }
        };

        const headingData = [
          {
            foo: 'bar'
          },
          {
            quux: 'baz'
          }
        ];

        mockery.registerMock('../data/procedures.json', headingData);
      });

      it('should return patient id not defined or empty string error', () => {
        delete messageObj.params.patientId;

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        expect(finished).toHaveBeenCalledWith({
          error: 'Patient Id not defined or empty string'
        });
      });

      it('should return heading not defined or empty string error', () => {
        delete messageObj.params.heading;

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        expect(finished).toHaveBeenCalledWith({
          error: 'Heading not defined or empty string'
        });
      });

      it('should populate patient', (done) => {
        const baseUrl = 'http://localhost';
        const data = {
          '0': [],
          '1': ['data']
        };

        httpMock(baseUrl, x => data[x]);

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith(['data']);
          done();
        }, 100);
      });

      it('should populate patient when HTTPS enabled', (done) => {
        q.userDefined.config.ssl = true;

        const baseUrl = 'https://localhost';
        const data = {
          '0': [],
          '1': ['data']
        };
        httpMock(baseUrl, x => data[x]);

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith(['data']);
          done();
        }, 100);
      });

      it('should populate patient when custom port is set', (done) => {
        q.userDefined.config.port = 9090;

        const baseUrl = 'http://localhost:9090';
        const data = {
          '0': [],
          '1': ['data']
        };
        httpMock(baseUrl, x => data[x]);

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith(['data']);
          done();
        }, 100);
      });

      it('should return error when get heading summary responds with server error #1', (done) => {
        nock('http://localhost')
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .replyWithError({
            'error': 'something awful happened'
          });

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith({
            'error': 'something awful happened'
          });
          done();
        }, 100);
      });

      it('should return invalid response from CDR service error #1', (done) => {
        nock('http://localhost')
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .reply(200, 'ok');

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith({
            error: 'Invalid response from CDR service'
          });
          done();
        }, 100);
      });

      it('should return patient already has data error', (done) => {
        nock('http://localhost')
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .reply(200, ['data']);

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith({
            error: 'Patient 9999999000 already has procedures data'
          });
          done();
        }, 100);
      });

      it('should return error when get heading summary responds with server error #2', (done) => {
        const baseUrl = 'http://localhost';
        const data = {
          '0': []
        };
        const ignoreSecondCall = true;

        httpMock(baseUrl, x => data[x], ignoreSecondCall);

        nock('http://localhost')
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .once()
          .replyWithError({
            'error': 'something awful happened'
          });

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith({
            'error': 'something awful happened'
          });
          done();
        }, 100);
      });

      it('should return invalid response from CDR service error #2', (done) => {
        const baseUrl = 'http://localhost';
        const data = {
          '0': []
        };
        const ignoreSecondCall = true;

        httpMock(baseUrl, x => data[x], ignoreSecondCall);

        nock('http://localhost')
          .matchHeader('authorization', 'Bearer jwt.token')
          .get('/api/patients/9999999000/procedures')
          .reply(200, 'ok');

        rippleAdmin.handlers.populatePatient.call(q, messageObj, session, send, finished);

        setTimeout(() => {
          expect(finished).toHaveBeenCalledWith({
            error: 'Invalid response from CDR service'
          });
          done();
        }, 100);
      });
    });
  });
});
