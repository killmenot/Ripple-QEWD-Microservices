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

  3 July 2018

*/

'use strict';

const nock = require('nock');
const Worker = require('../../mocks/worker');
const openEHR = require('../../../lib/src/openEHR');

describe('ripple-cdr-openehr/lib/src/openEHR', () => {
  let q;

  beforeEach(() => {
    q = new Worker();
  });

  afterEach(() => {
    q.db.reset();
    nock.cleanAll();
  });

  describe('#init', () => {});

  describe('#requests', () => {
    let params;
    let userObj;

    beforeEach(() => {
      userObj = {};
      openEHR.init.call(q);
    });

    it('should send requests to all servers', (done) => {
      params = {
        url: '/rest/v1/foo',
        useSessionId: false
      };

      nock('https://test.operon.systems')
        .get('/rest/v1/foo')
        .reply(200, {});
      nock('http://178.62.71.220:8080')
        .get('/rest/v1/foo')
        .reply(200, {});

      openEHR.requests(params, userObj);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();
        done();
      }, 100);
    });

    describe('params.method', () => {
      it('should send requests with custom method', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          method: 'POST'
        };

        nock('https://test.operon.systems')
          .post('/rest/v1/foo')
          .reply(200, {});
        nock('http://178.62.71.220:8080')
          .post('/rest/v1/foo')
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.sessions', () => {
      it('should send requests with Ehr-Session header', (done) => {
        params = {
          url: '/rest/v1/foo',
          sessions: {
            marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
            ethercis: '2c9a7b22-4cdd-484e-a8b5-759a70443be3'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
          .reply(200);
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .matchHeader('Ehr-Session', '2c9a7b22-4cdd-484e-a8b5-759a70443be3')
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });

      it('should do not send requests when no session available', () => {
        params = {
          url: '/rest/v1/foo',
          sessions: {}
        };

        openEHR.requests(params, userObj);
      });

      it('should do not send requests with callback when no session available', () => {
        params = {
          url: '/rest/v1/foo',
          sessions: {},
          callback: jasmine.createSpy()
        };

        openEHR.requests(params, userObj);

        expect(params.callback).toHaveBeenCalledWith(userObj);
      });
    });

    describe('params.queryString', () => {
      it('should send request with query string', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          queryString: {
            bar: 'quux',
            baz: 'foo'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo?bar=quux&baz=foo')
          .reply(200, {});
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo?bar=quux&baz=foo')
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.headers', () => {
      it('should send requests with headers', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          headers: {
            bar: 'quux',
            baz: 'foo'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .matchHeader('bar', 'quux')
          .matchHeader('baz', 'foo')
          .reply(200, {});
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .matchHeader('bar', 'quux')
          .matchHeader('baz', 'foo')
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });

      it('should send requests with headers when session host passed', (done) => {
        params = {
          url: '/rest/v1/foo',
          headers: {
            bar: 'quux',
            baz: 'foo'
          },
          sessions: {
            marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
            ethercis: '2c9a7b22-4cdd-484e-a8b5-759a70443be3'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
          .matchHeader('bar', 'quux')
          .matchHeader('baz', 'foo')
          .reply(200);
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .matchHeader('Ehr-Session', '2c9a7b22-4cdd-484e-a8b5-759a70443be3')
          .matchHeader('bar', 'quux')
          .matchHeader('baz', 'foo')
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.hostSpecific', () => {
      it('should send requests with host specific options', (done) => {
        params = {
          url: '/rest/v1/foo',
          method: 'POST',
          useSessionId: false,
          hostSpecific: {
            marand: {
              body: {
                bar: 'quux'
              }
            },
            ethercis: {
              body: {
                baz: 'foo'
              }
            }
          }
        };

        nock('https://test.operon.systems')
          .post('/rest/v1/foo', {bar: 'quux'})
          .reply(200, {});
        nock('http://178.62.71.220:8080')
          .post('/rest/v1/foo', {baz: 'foo'})
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.dontAsk', () => {
      it('should not send request when dontAsk', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          dontAsk: {
            ethercis: true
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, {});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });

      it('should not send request with callback when dontAsk', () => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          dontAsk: {
            marand: true,
            ethercis: true
          },
          callback: jasmine.createSpy()
        };

        openEHR.requests(params, userObj);

        expect(params.callback).toHaveBeenCalledWith(userObj);
      });
    });

    describe('params.processBody', () => {
      it('should run process body callback with correct parameters', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          processBody: jasmine.createSpy()
        };

        userObj = {
          quux: 'baz'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, {foo: 'bar'});
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .reply(200, {bar: 'foos'});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.processBody).toHaveBeenCalledWith({foo: 'bar'}, 'marand', {quux: 'baz'});
          expect(params.processBody).toHaveBeenCalledWith({bar: 'foos'}, 'ethercis', {quux: 'baz'});
          done();

        }, 100);
      });

      it('should do not run process body callback when error occured', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          processBody: jasmine.createSpy()
        };

        userObj = {
          quux: 'baz'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200);
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .reply(200, {bar: 'foos'});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();

          expect(params.processBody).toHaveBeenCalledTimes(1);
          expect(params.processBody).toHaveBeenCalledWith({bar: 'foos'}, 'ethercis', {quux: 'baz'});

          done();
        }, 100);
      });
    });

    describe('params.callback', () => {
      it('should run callback with correct parameters', (done) => {
        params = {
          url: '/rest/v1/foo',
          useSessionId: false,
          callback: jasmine.createSpy()
        };
        userObj = {
          quux: 'baz'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, {foo: 'bar'});
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .reply(200, {bar: 'foos'});

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.callback).toHaveBeenCalledWith({quux: 'baz'});
          done();
        }, 100);
      });
    });

    describe('params.type', () => {
      describe('startSessions', () => {
        it('should send requests to servers when sessions do not exist', (done) => {
          const qewdSession = q.sessions.create('app');

          params = {
            url: '/rest/v1/session',
            useSessionId: false,
            type: 'startSessions',
            session: qewdSession
          };

          nock('https://test.operon.systems')
            .get('/rest/v1/session')
            .query({
              username: 'foo',
              password: '123456'
            })
            .reply(200);
          nock('http://178.62.71.220:8080')
            .get('/rest/v1/session')
            .query({
              username: 'bar',
              password: 'quux'
            })
            .reply(200);

            openEHR.requests(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();
            done();
          }, 100);
        });

        it('should send requests to servers and delete expired sessions', (done) => {
          const qewdSession = q.sessions.create('app');

          // expired marand session
          const now = new Date().getTime();
          const marandSession = {
            creationTime: now - 150000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(marandSession);

          // expired ethercis session
          const ethercisSession = {
            creationTime: now - 150000,
            id: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercisSession);

          params = {
            url: '/rest/v1/session',
            useSessionId: false,
            type: 'startSessions',
            session: qewdSession
          };

          nock('https://test.operon.systems')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
            .reply(200);
          nock('https://test.operon.systems')
            .get('/rest/v1/session')
            .query({
              username: 'foo',
              password: '123456'
            })
            .reply(200);

          nock('http://178.62.71.220:8080')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '260a7be5-e00f-4b1e-ad58-27d95604d010')
            .reply(200);
          nock('http://178.62.71.220:8080')
            .get('/rest/v1/session')
            .query({
              username: 'bar',
              password: 'quux'
            })
            .reply(200);

          openEHR.requests(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();

            expect(qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument()).toEqual({});
            expect(qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).getDocument()).toEqual({});

            done();
          }, 100);
        });

        it('should use cached sessions when they are not expired', () => {
          const qewdSession = q.sessions.create('app');

          // active marand session
          const now = new Date().getTime();
          const marandSession = {
            creationTime: now - 50000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(marandSession);

          // active ethercis session
          const ethercisSession = {
            creationTime: now - 50000,
            id: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercisSession);

          params = {
            url: '/rest/v1/session',
            useSessionId: false,
            type: 'startSessions',
            session: qewdSession
          };

          openEHR.requests(params, userObj);

          expect(userObj).toEqual({
            marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
            ethercis: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          });
        });

        it('should use cached sessiosn and pass they to callback when sessions are not expired', () => {
          const qewdSession = q.sessions.create('app');

          // active marand session
          const now = new Date().getTime();
          const marandSession = {
            creationTime: now - 50000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(marandSession);

          // active ethercis session
          const ethercisSession = {
            creationTime: now - 50000,
            id: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercisSession);

          params = {
            url: '/rest/v1/session',
            useSessionId: false,
            type: 'startSessions',
            session: qewdSession,
            callback: jasmine.createSpy()
          };

          openEHR.requests(params, userObj);

          expect(params.callback).toHaveBeenCalledWith({
            marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
            ethercis: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          });
        });
      });

      describe('stopSessions', () => {
        it('should send request to servers when sessions do not exist', (done) => {
          const qewdSession = q.sessions.create('app');

          params = {
            method: 'DELETE',
            url: '/rest/v1/session',
            type: 'stopSessions',
            sessions: {
              marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
              ethercis: '260a7be5-e00f-4b1e-ad58-27d95604d010'
            },
            session: qewdSession
          };

          nock('https://test.operon.systems')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
            .reply(200);
          nock('http://178.62.71.220:8080')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '260a7be5-e00f-4b1e-ad58-27d95604d010')
            .reply(200);

          openEHR.requests(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();
            done();
          }, 100);
        });

        it('should do not stop sessions when they are not expired', () => {
          const qewdSession = q.sessions.create('app');

          const now = new Date().getTime();

          const marandSession = {
            creationTime: now - 10000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(marandSession);

          const ethercisSession = {
            creationTime: now - 10000,
            id: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercisSession);

          params = {
            method: 'DELETE',
            url: '/rest/v1/session',
            type: 'stopSessions',
            sessions: {
              marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
              ethercis: '260a7be5-e00f-4b1e-ad58-27d95604d010'
            },
            session: qewdSession
          };

          openEHR.requests(params, userObj);

          expect(qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument()).toEqual(marandSession);
          expect(qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).getDocument()).toEqual(ethercisSession);
        });

        it('should do not stop sessions with callback when they are not expired', () => {
          const qewdSession = q.sessions.create('app');

          const now = new Date().getTime();

          const marandSession = {
            creationTime: now - 10000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(marandSession);

          const ethercisSession = {
            creationTime: now - 10000,
            id: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercisSession);

          params = {
            method: 'DELETE',
            url: '/rest/v1/session',
            type: 'stopSessions',
            sessions: {
              marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
              ethercis: '260a7be5-e00f-4b1e-ad58-27d95604d010'
            },
            session: qewdSession,
            callback: jasmine.createSpy()
          };

          openEHR.requests(params, userObj);

          expect(qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument()).toEqual(marandSession);
          expect(qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).getDocument()).toEqual(ethercisSession);
          expect(params.callback).toHaveBeenCalledWith(userObj);
        });

        it('should send request to the server and delete cached session', (done) => {
          const qewdSession = q.sessions.create('app');

          const now = new Date().getTime();

          const marandSession = {
            creationTime: now - 150000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(marandSession);

          const ethercisSession = {
            creationTime: now - 150000,
            id: '260a7be5-e00f-4b1e-ad58-27d95604d010'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercisSession);

          params = {
            method: 'DELETE',
            url: '/rest/v1/session',
            type: 'stopSessions',
            sessions: {
              marand: '03391e86-5085-4b99-89ff-79209f8d1f20',
              ethercis: '260a7be5-e00f-4b1e-ad58-27d95604d010'
            },
            session: qewdSession,
            callback: jasmine.createSpy()
          };

          nock('https://test.operon.systems')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
            .reply(200);
          nock('http://178.62.71.220:8080')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '260a7be5-e00f-4b1e-ad58-27d95604d010')
            .reply(200);

          openEHR.requests(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();

            expect(qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument()).toEqual({});
            expect(qewdSession.data.$(['openEHR', 'sessions', 'ethercis']).getDocument()).toEqual({});

            done();
          }, 100);
        });
      });
    });

    describe('error handling', () => {
      it('should handle when server responds with error', (done) => {
        params = {
          useSessionId: false,
          url: '/rest/v1/foo',
          processBody: jasmine.createSpy()
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .replyWithError({
            'message': 'something awful happened',
            'code': 'AWFUL_ERROR_MARAND'
          });
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .replyWithError({
            'message': 'something awful happened',
            'code': 'AWFUL_ERROR_MARAND'
          });

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.processBody).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      it('should handle when server responds with string', (done) => {
        params = {
          useSessionId: false,
          url: '/rest/v1/foo',
          processBody: jasmine.createSpy()
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, 'this is string error');
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .reply(200, 'this is string error');

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.processBody).toHaveBeenCalledTimes(2);
          done();
        }, 100);
      });

      it('should handle when server responds with html', (done) => {
        params = {
          useSessionId: false,
          url: '/rest/v1/foo',
          processBody: jasmine.createSpy()
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, '<html><h1>this is html error</h1></html>');
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .reply(200, '<html><h1>this is html error</h1></html>');

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.processBody).not.toHaveBeenCalled();
          done();
        }, 100);
      });

      it('should handle when server responds with no response', (done) => {
        params = {
          useSessionId: false,
          url: '/rest/v1/foo',
          processBody: jasmine.createSpy()
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200);
        nock('http://178.62.71.220:8080')
          .get('/rest/v1/foo')
          .reply(200);

        openEHR.requests(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.processBody).not.toHaveBeenCalled();
          done();
        }, 100);
      });
    });
  });

  describe('#request', () => {
    let params;
    let userObj;

    beforeEach(() => {
      userObj = {};
      openEHR.init.call(q);
    });

    it('should send request to the server', (done) => {
      params = {
        host: 'marand',
        url: '/rest/v1/foo'
      };

      nock('https://test.operon.systems')
        .get('/rest/v1/foo')
        .reply(200);

      openEHR.request(params, userObj);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();
        done();
      }, 100);
    });

    describe('params.method', () => {
      it('should send request with custom method', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          method: 'POST'
        };

        nock('https://test.operon.systems')
          .post('/rest/v1/foo')
          .reply(200);

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.session', () => {
      it('should send request with Ehr-Session header', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          session: '03391e86-5085-4b99-89ff-79209f8d1f20'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
          .reply(200);

        openEHR.request(params);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.queryString', () => {
      it('should send request with query string', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          queryString: {
            bar: 'quux',
            baz: 'foo'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo?bar=quux&baz=foo')
          .reply(200);

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.headers', () => {
      it('should send request with headers', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          headers: {
            bar: 'quux',
            baz: 'foo'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .matchHeader('bar', 'quux')
          .matchHeader('baz', 'foo')
          .reply(200);

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });

      it('should send request with headers when session passed', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          session: '03391e86-5085-4b99-89ff-79209f8d1f20',
          headers: {
            bar: 'quux',
            baz: 'foo'
          }
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
          .matchHeader('bar', 'quux')
          .matchHeader('baz', 'foo')
          .reply(200);

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.options', () => {
      it('should send request with custom request options', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          method: 'POST',
          options: {
            body: {
              baz: 'quux'
            }
          }
        };

        nock('https://test.operon.systems')
          .post('/rest/v1/foo', {
            baz: 'quux'
          })
          .reply(200);

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.processBody', () => {
      it('should run process body callback with correct parameters', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          processBody: jasmine.createSpy()
        };
        userObj = {
          quux: 'baz'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, {foo: 'bar'});

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.processBody).toHaveBeenCalledWith({foo: 'bar'}, {quux: 'baz'});
          done();
        }, 100);
      });
    });

    describe('params.callback', () => {
      it('should run callback with correct parameters', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          callback: jasmine.createSpy()
        };
        userObj = {
          quux: 'baz'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200, {foo: 'bar'});

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          expect(params.callback).toHaveBeenCalledWith({quux: 'baz'});
          done();
        }, 100);
      });
    });

    describe('params.logResponse', () => {
      it('should do not log response to console', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo',
          logResponse: false
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .reply(200);

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });

    describe('params.type', () => {
      describe('startSession', () => {
        it('should send request to the server when session does not exist', (done) => {
          const qewdSession = q.sessions.create('app');

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            url: '/rest/v1/session',
            type: 'startSession',
            qewd_session: qewdSession
          };
          /*jshint camelcase: true */

          nock('https://test.operon.systems')
            .get('/rest/v1/session')
            .reply(200);

          openEHR.request(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();
            done();
          }, 100);
        });

        it('should send request to the server and delete expired session', (done) => {
          const qewdSession = q.sessions.create('app');

          // expired session
          const now = new Date().getTime();
          const session = {
            creationTime: now - 150000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(session);

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            url: '/rest/v1/session',
            type: 'startSession',
            qewd_session: qewdSession
          };
          /*jshint camelcase: true */

          nock('https://test.operon.systems')
            .delete('/rest/v1/session')
            .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
            .reply(200);
          nock('https://test.operon.systems')
            .get('/rest/v1/session')
            .reply(200);

          openEHR.request(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();

            const actual = qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument();
            expect(actual).toEqual({});

            done();
          }, 100);
        });

        it('should use cached session when session is not expired', () => {
          const qewdSession = q.sessions.create('app');

          // active session
          const now = new Date().getTime();
          const session = {
            creationTime: now - 10000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(session);

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            url: '/rest/v1/session',
            type: 'startSession',
            qewd_session: qewdSession
          };
          /*jshint camelcase: true */

          openEHR.request(params, userObj);

          expect(userObj).toEqual({
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          });
        });

        it('should use cached session and pass it to callback when session is not expired', () => {
          const qewdSession = q.sessions.create('app');

          // active session
          const now = new Date().getTime();
          const session = {
            creationTime: now - 60000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(session);

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            url: '/rest/v1/session',
            type: 'startSession',
            qewd_session: qewdSession,
            callback: jasmine.createSpy()
          };
          /*jshint camelcase: true */

          openEHR.request(params, userObj);

          expect(params.callback).toHaveBeenCalledWith({
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          });
        });
      });

      describe('stopSession', () => {
        it('should send request to the server when session does not exist', (done) => {
          const qewdSession = q.sessions.create('app');

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            method: 'DELETE',
            url: '/rest/v1/foo',
            type: 'stopSession',
            session: '03391e86-5085-4b99-89ff-79209f8d1f20',
            qewd_session: qewdSession
          };
          /*jshint camelcase: true */

          nock('https://test.operon.systems')
            .delete('/rest/v1/foo')
            .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
            .reply(200);

          openEHR.request(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();
            done();
          }, 100);
        });

        it('should do not stop session when it is not expired', () => {
          const qewdSession = q.sessions.create('app');

          // active session
          const now = new Date().getTime();
          const session = {
            creationTime: now - 10000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(session);

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            method: 'DELETE',
            url: '/rest/v1/foo',
            type: 'stopSession',
            session: '03391e86-5085-4b99-89ff-79209f8d1f20',
            qewd_session: qewdSession
          };
          /*jshint camelcase: true */

          openEHR.request(params, userObj);

          const actual = qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument();

          expect(actual).toEqual(session);
        });

        it('should do not stop session with callback when it is not expired', () => {
          const qewdSession = q.sessions.create('app');

          // active session
          const now = new Date().getTime();
          const session = {
            creationTime: now - 10000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(session);

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            method: 'DELETE',
            url: '/rest/v1/foo',
            type: 'stopSession',
            session: '03391e86-5085-4b99-89ff-79209f8d1f20',
            qewd_session: qewdSession,
            callback: jasmine.createSpy()
          };
          /*jshint camelcase: true */

          openEHR.request(params, userObj);

          const actual = qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument();

          expect(actual).toEqual(session);
          expect(params.callback).toHaveBeenCalledWith(userObj);
        });

        it('should send request to the server and delete cached session', (done) => {
          const qewdSession = q.sessions.create('app');

          // expired session
          const now = new Date().getTime();
          const session = {
            creationTime: now - 150000,
            id: '03391e86-5085-4b99-89ff-79209f8d1f20'
          };
          qewdSession.data.$(['openEHR', 'sessions', 'marand']).setDocument(session);

          /*jshint camelcase: false */
          params = {
            host: 'marand',
            method: 'DELETE',
            url: '/rest/v1/foo',
            type: 'stopSession',
            session: '03391e86-5085-4b99-89ff-79209f8d1f20',
            qewd_session: qewdSession
          };
          /*jshint camelcase: true */

          nock('https://test.operon.systems')
            .delete('/rest/v1/foo')
            .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
            .reply(200);

          openEHR.request(params, userObj);

          setTimeout(() => {
            expect(nock).toHaveBeenDone();

            const actual = qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument();
            expect(actual).toEqual({});

            done();
          }, 100);
        });
      });
    });

    describe('error handling', () => {
      it('should handle errors', (done) => {
        params = {
          host: 'marand',
          url: '/rest/v1/foo'
        };

        nock('https://test.operon.systems')
          .get('/rest/v1/foo')
          .replyWithError({
            'message': 'something awful happened',
            'code': 'AWFUL_ERROR'
          });

        openEHR.request(params, userObj);

        setTimeout(() => {
          expect(nock).toHaveBeenDone();
          done();
        }, 100);
      });
    });
  });

  describe('#startSessions', () => {
    let session;
    let callback;
    let data;

    function httpMock(data) {
      nock('https://test.operon.systems')
        .post('/rest/v1/session?username=foo&password=123456')
        .matchHeader('x-max-session', 75)
        .matchHeader('x-session-timeout', 120000)
        .reply(200, data.marand);

      nock('http://178.62.71.220:8080')
        .post('/rest/v1/session?username=bar&password=quux')
        .matchHeader('x-max-session', 75)
        .matchHeader('x-session-timeout', 120000)
        .reply(200, data.ethercis);
    }

    beforeEach(() => {
      openEHR.init.call(q);

      session = q.sessions.create('app');
      callback = jasmine.createSpy();

      data = {
        marand: {
          sessionId: '2561c861-aa31-4f1b-be2a-a8a034027ee6'
        },
        ethercis: {
          sessionId: '28eb4581-4bc1-4636-99c5-86cb4a388ac0'
        }
      };
    });

    it('should start and cache sessions', (done) => {
      httpMock(data);

      openEHR.startSessions(session, callback);

      setTimeout(() => {
        let actual;

        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalledWith({
          marand: '2561c861-aa31-4f1b-be2a-a8a034027ee6',
          ethercis: '28eb4581-4bc1-4636-99c5-86cb4a388ac0'
        });

        actual = session.data.$(['openEHR', 'sessions', 'marand']).getDocument();
        expect(actual).toEqual({
          creationTime: jasmine.any(Number),
          id: '2561c861-aa31-4f1b-be2a-a8a034027ee6'
        });

        actual = session.data.$(['openEHR', 'sessions', 'ethercis']).getDocument();
        expect(actual).toEqual({
          creationTime: jasmine.any(Number),
          id: '28eb4581-4bc1-4636-99c5-86cb4a388ac0'
        });

        done();
      }, 100);
    });

    it('should not start and cache sessions when no data returned', (done) => {
      data = {
        marand: {},
        ethercis: null
      };
      httpMock(data);

      openEHR.startSessions(session, callback);

      setTimeout(() => {
        let actual;

        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalledWith({});

        actual = session.data.$(['openEHR', 'sessions', 'marand']).getDocument();
        expect(actual).toEqual({});

        actual = session.data.$(['openEHR', 'sessions', 'ethercis']).getDocument();
        expect(actual).toEqual({});

        done();
      }, 100);
    });

    it('should start and not cache sessions when no session passed', (done) => {
      httpMock(data);

      openEHR.startSessions(callback);

      setTimeout(() => {
        let actual;

        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalledWith({
          marand: '2561c861-aa31-4f1b-be2a-a8a034027ee6',
          ethercis: '28eb4581-4bc1-4636-99c5-86cb4a388ac0'
        });

        actual = session.data.$(['openEHR', 'sessions', 'marand']).getDocument();
        expect(actual).toEqual({});

        actual = session.data.$(['openEHR', 'sessions', 'ethercis']).getDocument();
        expect(actual).toEqual({});

        done();
      }, 100);
    });
  });

  describe('#stopSessions', () => {
    let sessions;
    let session;
    let callback;

    function httpMock() {
      nock('https://test.operon.systems')
        .delete('/rest/v1/session')
        .matchHeader('ehr-session', '2561c861-aa31-4f1b-be2a-a8a034027ee6')
        .reply(204);

      nock('http://178.62.71.220:8080')
        .delete('/rest/v1/session')
        .matchHeader('ehr-session', '28eb4581-4bc1-4636-99c5-86cb4a388ac0')
        .reply(204);
    }

    function seeds(sessions) {
      const now = new Date().getTime();

      const marand = {
        creationTime: now - 150000,
        id: sessions.marand
      };
      session.data.$(['openEHR', 'sessions', 'marand']).setDocument(marand);

      const ethercis = {
        creationTime: now - 150000,
        id: sessions.ethercis
      };
      session.data.$(['openEHR', 'sessions', 'ethercis']).setDocument(ethercis);
    }

    beforeEach(() => {
      openEHR.init.call(q);

      sessions = {
        marand: '2561c861-aa31-4f1b-be2a-a8a034027ee6',
        ethercis: '28eb4581-4bc1-4636-99c5-86cb4a388ac0'
      };
      session = q.sessions.create('app');
      callback = jasmine.createSpy();
    });

    it('should stop sessions and delete them from cache', (done) => {
      httpMock();
      seeds(sessions);

      openEHR.stopSessions(sessions, session, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalledWith({
          marand: '2561c861-aa31-4f1b-be2a-a8a034027ee6',
          ethercis: '28eb4581-4bc1-4636-99c5-86cb4a388ac0'
        });

        expect(session.data.$(['openEHR', 'sessions', 'marand']).getDocument()).toEqual({});
        expect(session.data.$(['openEHR', 'sessions', 'ethercis']).getDocument()).toEqual({});

        done();
      }, 100);
    });
  });

  describe('#startSession', () => {
    let host;
    let qewdSession;
    let callback;

    beforeEach(() => {
      host = 'marand';
      qewdSession = q.sessions.create('app');
      callback = jasmine.createSpy();

      openEHR.init.call(q);
    });

    it('should send request to the server', (done) => {
      nock('https://test.operon.systems')
        .post('/rest/v1/session')
        .query({
          username: 'foo',
          password: '123456'
        })
        .matchHeader('x-max-session', 75)
        .matchHeader('x-session-timeout', 120000)
        .reply(200, {
          sessionId: '03391e86-5085-4b99-89ff-79209f8d1f20'
        });

      openEHR.startSession(host, null, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalledWith({
          id: '03391e86-5085-4b99-89ff-79209f8d1f20'
        });

        done();
      }, 100);
    });

    it('should send request to the server and cache session in db', (done) => {
      const expected = {
        creationTime: jasmine.any(Number),
        id: '03391e86-5085-4b99-89ff-79209f8d1f20'
      };

      nock('https://test.operon.systems')
        .post('/rest/v1/session')
        .query({
          username: 'foo',
          password: '123456'
        })
        .matchHeader('x-max-session', 75)
        .matchHeader('x-session-timeout', 120000)
        .reply(200, {
          sessionId: '03391e86-5085-4b99-89ff-79209f8d1f20'
        });

      openEHR.startSession(host, qewdSession, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalledWith({
          id: '03391e86-5085-4b99-89ff-79209f8d1f20'
        });

        const actual = qewdSession.data.$(['openEHR', 'sessions', 'marand']).getDocument();
        expect(actual).toEqual(expected);

        done();
      }, 100);
    });
  });

  describe('#stopSession', () => {
    let host;
    let qewdSession;
    let sessionId;
    let callback;

    beforeEach(() => {
      host = 'marand';
      qewdSession = q.sessions.create('app');
      sessionId = '03391e86-5085-4b99-89ff-79209f8d1f20';
      callback = jasmine.createSpy();

      openEHR.init.call(q);
    });

    it('should send request to the server', (done) => {
      nock('https://test.operon.systems')
        .delete('/rest/v1/session')
        .reply(200);

      openEHR.stopSession(host, sessionId, qewdSession, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();
        expect(callback).toHaveBeenCalled();

        done();
      }, 100);
    });
  });

  describe('#mapNHSNo', () => {
    let nhsNo;
    let sessions;
    let callback;

    function httpMock(data) {
      nock('https://test.operon.systems')
        .get('/rest/v1/ehr')
        .query({
          subjectId: '00fa6812-9434-4455-9c7b-a956e1a17317',
          subjectNamespace: 'uk.nhs.nhs_number',
        })
        .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
        .reply(200, data);
    }

    beforeEach(() => {
      delete q.userDefined.openehr.ethercis;

      openEHR.init.call(q);

      nhsNo = '00fa6812-9434-4455-9c7b-a956e1a17317';
      sessions = {
        marand: '03391e86-5085-4b99-89ff-79209f8d1f20'
      };
      callback = jasmine.createSpy();
    });

    it('should send request to the server and build map', (done) => {
      const data = {
        ehrId: '03134cc0-3741-4d3f-916a-a279a24448e5'
      };
      httpMock(data);

      openEHR.mapNHSNo(nhsNo, sessions, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();

        const rippleNHSNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo, 'marand']);
        expect(rippleNHSNoMap.value).toBe('03134cc0-3741-4d3f-916a-a279a24448e5');

        const ehrIdMap = new q.documentStore.DocumentNode('rippleEhrIdMap', ['marand', data.ehrId]);
        expect(ehrIdMap.value).toBe(nhsNo);

        done();
      }, 100);
    });

    it('should send request to the server and not build map when no data returned', (done) => {
      const data = {};
      httpMock(data);

      openEHR.mapNHSNo(nhsNo, sessions, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();

        const rippleNHSNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo, 'marand']);
        expect(rippleNHSNoMap.exists).toBeFalsy();

        done();
      }, 100);
    });

    it('should not send request and rebuild map when map exists', () => {
      const ehrId = '03134cc0-3741-4d3f-916a-a279a24448e5';
      const host = 'marand';

      const rippleNHSNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo, host]);
      rippleNHSNoMap.value = ehrId;

      const ehrIdMap = new q.documentStore.DocumentNode('rippleEhrIdMap', [host, ehrId]);
      ehrIdMap.value = nhsNo;

      openEHR.mapNHSNo(nhsNo, sessions);
    });
  });

  describe('#mapNHSNoByHost', () => {
    let nhsNo;
    let host;
    let sessionId;
    let callback;

    function httpMock(data) {
      nock('https://test.operon.systems')
        .get('/rest/v1/ehr')
        .matchHeader('Ehr-Session', '03391e86-5085-4b99-89ff-79209f8d1f20')
        .query({
          subjectId: '00fa6812-9434-4455-9c7b-a956e1a17317',
          subjectNamespace: 'uk.nhs.nhs_number'
        })
        .reply(200, data);
    }

    beforeEach(() => {
      openEHR.init.call(q);

      nhsNo = '00fa6812-9434-4455-9c7b-a956e1a17317';
      host = 'marand';
      sessionId = '03391e86-5085-4b99-89ff-79209f8d1f20';
      callback = jasmine.createSpy();
    });

    it('should send request to the server and build map', (done) => {
      const data = {
        ehrId: '03134cc0-3741-4d3f-916a-a279a24448e5'
      };
      httpMock(data);

      openEHR.mapNHSNoByHost(nhsNo, host, sessionId, callback);

      setTimeout(() => {
        expect(nock).toHaveBeenDone();

        const rippleNHSNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo, host]);
        expect(rippleNHSNoMap.value).toBe(data.ehrId);

        const ehrIdMap = new q.documentStore.DocumentNode('rippleEhrIdMap', [host, data.ehrId]);
        expect(ehrIdMap.value).toBe(nhsNo);

        done();
      }, 100);

      //
    });

    it('should not send request and return cached value when map exists', () => {
      const ehrId = '03134cc0-3741-4d3f-916a-a279a24448e5';

      const nhsNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo, host]);
      nhsNoMap.value = '03134cc0-3741-4d3f-916a-a279a24448e5';

      openEHR.mapNHSNoByHost(nhsNo, host, sessionId, callback);

      expect(callback).toHaveBeenCalledWith(ehrId);
    });
  });

  describe('#idsAvailable', () => {
    beforeEach(() => {
      openEHR.init.call(q);
    });

    it('should return false', () => {
      const nhsNo = '00fa6812-9434-4455-9c7b-a956e1a17317';

      const actual = openEHR.idsAvailable(nhsNo);

      expect(actual).toBeFalsy();
    });

    it('should return true', () => {
      const nhsNo = '00fa6812-9434-4455-9c7b-a956e1a17317';

      const data = {foo: 'bar'};
      const rippleNHSNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo]);
      rippleNHSNoMap.setDocument(data);

      const actual = openEHR.idsAvailable(nhsNo);

      expect(actual).toBeTruthy();
    });
  });

  describe('#getEhrId', () => {
    beforeEach(() => {
      openEHR.init.call(q);
    });

    it('should return ehr id', () => {
      const expected = 9999999018;

      const nhsNo = '00fa6812-9434-4455-9c7b-a956e1a17317';
      const host = 'marand';

      const rippleNHSNoMap = new q.documentStore.DocumentNode('rippleNHSNoMap', [nhsNo, host]);
      rippleNHSNoMap.value = 9999999018;

      const actual = openEHR.getEhrId(nhsNo, host);

      expect(actual).toEqual(expected);
    });
  });
});
