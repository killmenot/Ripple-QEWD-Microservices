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

const router = require('qewd-router');
const mockery = require('mockery');
const Worker = require('../mocks/worker');

describe('ripple-cdr-openehr/lib/ripple-cdr-openehr', () => {
  let rippleCdrOpenEhr;

  let q;

  function getRippleCdrOpenEhr() {
    delete require.cache[require.resolve('../../lib/ripple-cdr-openehr')];
    return require('../../lib/ripple-cdr-openehr');
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

    spyOn(router, 'addMicroServiceHandler');
  });

  afterEach(() => {
    mockery.deregisterAll();
    q.db.reset();
  });

  describe('#init', () => {
    it('GET /api/openehr/check', () => {
      const checkNHSNumber = jasmine.createSpy();
      mockery.registerMock('./handlers/checkNHSNumber', checkNHSNumber);

      const expected = jasmine.objectContaining({
        '/api/openehr/check': {
          GET: checkNHSNumber
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/heading/:heading/fields/summary', () => {
      const getHeadingSummaryFields = jasmine.createSpy();
      mockery.registerMock('./handlers/getSummaryHeadingFields', getHeadingSummaryFields);

      const expected = jasmine.objectContaining({
        '/api/heading/:heading/fields/summary': {
          GET: getHeadingSummaryFields
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/my/heading/:heading', () => {
      const getMyHeadingSummary = jasmine.createSpy();
      mockery.registerMock('./handlers/getMyHeadingSummary', getMyHeadingSummary);

      const expected = jasmine.objectContaining({
        '/api/my/heading/:heading': jasmine.objectContaining({
          GET: getMyHeadingSummary
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('POST /api/my/heading/:heading', () => {
      const postMyHeading = jasmine.createSpy();
      mockery.registerMock('./handlers/postMyHeading', postMyHeading);

      const expected = jasmine.objectContaining({
        '/api/my/heading/:heading': jasmine.objectContaining({
          POST: postMyHeading
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/my/heading/:heading/:sourceId', () => {
      const getMyHeadingDetail = jasmine.createSpy();
      mockery.registerMock('./handlers/getMyHeadingDetail', getMyHeadingDetail);

      const expected = jasmine.objectContaining({
        '/api/my/heading/:heading/:sourceId': {
          GET: getMyHeadingDetail
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/my/headings/synopsis', () => {
      const getMySynopsis = jasmine.createSpy();
      mockery.registerMock('./handlers/getMySynopsis', getMySynopsis);

      const expected = jasmine.objectContaining({
        '/api/my/headings/synopsis': {
          GET: getMySynopsis
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/headings/synopsis', () => {
      const getPatientSynopsis = jasmine.createSpy();
      mockery.registerMock('./handlers/getPatientSynopsis', getPatientSynopsis);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/headings/synopsis': {
          GET: getPatientSynopsis
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/synopsis/:heading', () => {
      const getPatientHeadingSynopsis = jasmine.createSpy();
      mockery.registerMock('./handlers/getPatientHeadingSynopsis', getPatientHeadingSynopsis);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/synopsis/:heading': {
          GET: getPatientHeadingSynopsis
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('POST /api/patients/:patientId/top3Things', () => {
      const postTop3Things = jasmine.createSpy();
      mockery.registerMock('./top3Things/postTop3Things', postTop3Things);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/top3Things': jasmine.objectContaining({
          POST: postTop3Things
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/top3Things', () => {
      const getTop3ThingsSummary = jasmine.createSpy();
      mockery.registerMock('./top3Things/getTop3ThingsSummary', getTop3ThingsSummary);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/top3Things': jasmine.objectContaining({
          GET: getTop3ThingsSummary
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('PUT /api/patients/:patientId/top3Things/:sourceId', () => {
      const postTop3Things = jasmine.createSpy();
      mockery.registerMock('./top3Things/postTop3Things', postTop3Things);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/top3Things/:sourceId': jasmine.objectContaining({
          PUT: postTop3Things
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/top3Things/:sourceId', () => {
      const getTop3ThingsDetail = jasmine.createSpy();
      mockery.registerMock('./top3Things/getTop3ThingsDetail', getTop3ThingsDetail);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/top3Things/:sourceId': jasmine.objectContaining({
          GET: getTop3ThingsDetail
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/:heading', () => {
      const getHeadingSummary = jasmine.createSpy();
      mockery.registerMock('./handlers/getHeadingSummary', getHeadingSummary);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading': jasmine.objectContaining({
          GET: getHeadingSummary
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('POST /api/patients/:patientId/:heading', () => {
      const postPatientHeading = jasmine.createSpy();
      mockery.registerMock('./handlers/postPatientHeading', postPatientHeading);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading': jasmine.objectContaining({
          POST: postPatientHeading
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/:heading/:sourceId', () => {
      const getHeadingDetail = jasmine.createSpy();
      mockery.registerMock('./handlers/getHeadingDetail', getHeadingDetail);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading/:sourceId': jasmine.objectContaining({
          GET: getHeadingDetail
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/patients/:patientId/:heading/:sourceId', () => {
      const getHeadingDetail = jasmine.createSpy();
      mockery.registerMock('./handlers/getHeadingDetail', getHeadingDetail);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading/:sourceId': jasmine.objectContaining({
          GET: getHeadingDetail
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('PUT /api/patients/:patientId/:heading/:sourceId', () => {
      const editPatientHeading = jasmine.createSpy();
      mockery.registerMock('./handlers/editPatientHeading', editPatientHeading);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading/:sourceId': jasmine.objectContaining({
          PUT: editPatientHeading
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('DELETE /api/patients/:patientId/:heading/:sourceId', () => {
      const deletePatientHeading = jasmine.createSpy();
      mockery.registerMock('./handlers/deletePatientHeading', deletePatientHeading);

      const expected = jasmine.objectContaining({
        '/api/patients/:patientId/:heading/:sourceId': jasmine.objectContaining({
          DELETE: deletePatientHeading
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/feeds', () => {
      const getFeedSummary = jasmine.createSpy();
      mockery.registerMock('./feeds/getSummary', getFeedSummary);

      const expected = jasmine.objectContaining({
        '/api/feeds': jasmine.objectContaining({
          GET: getFeedSummary
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('POST /api/feeds', () => {
      const postFeed = jasmine.createSpy();
      mockery.registerMock('./feeds/post', postFeed);

      const expected = jasmine.objectContaining({
        '/api/feeds': jasmine.objectContaining({
          POST: postFeed
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /api/feeds/:sourceId', () => {
      const getFeedDetail = jasmine.createSpy();
      mockery.registerMock('./feeds/getDetail', getFeedDetail);

      const expected = jasmine.objectContaining({
        '/api/feeds/:sourceId': jasmine.objectContaining({
          GET: getFeedDetail
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('PUT /api/feeds/:sourceId', () => {
      const editFeed = jasmine.createSpy();
      mockery.registerMock('./feeds/edit', editFeed);

      const expected = jasmine.objectContaining({
        '/api/feeds/:sourceId': jasmine.objectContaining({
          PUT: editFeed
        })
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('GET /discovery/merge/:heading', () => {
      const mergeDiscoveryData = jasmine.createSpy();
      mockery.registerMock('./handlers/mergeDiscoveryData', mergeDiscoveryData);

      const expected = jasmine.objectContaining({
        '/discovery/merge/:heading': {
          GET: mergeDiscoveryData
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('DELETE /api/discovery/revert/:patientId/:heading', () => {
      const revertDiscoveryData = jasmine.createSpy();
      mockery.registerMock('./handlers/revertDiscoveryData', revertDiscoveryData);

      const expected = jasmine.objectContaining({
        '/api/discovery/revert/:patientId/:heading': {
          DELETE: revertDiscoveryData
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });

    it('DELETE /api/discovery/revert/all', () => {
      const revertAllDiscoveryData = jasmine.createSpy();
      mockery.registerMock('./handlers/revertAllDiscoveryData', revertAllDiscoveryData);

      const expected = jasmine.objectContaining({
        '/api/discovery/revert/all': {
          DELETE: revertAllDiscoveryData
        }
      })

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
      rippleCdrOpenEhr.init.call(q);

      expect(router.addMicroServiceHandler).toHaveBeenCalledWith(expected, rippleCdrOpenEhr);
    });
  });

  describe('#beforeMicroServiceHandler', () => {
    let args;
    let finished;

    beforeEach(() => {
      args = {
        session: {
          role: 'admin'
        }
      };
      finished = jasmine.createSpy();

      rippleCdrOpenEhr = getRippleCdrOpenEhr();
    });

    it('should return false', () => {
      q.jwt.handlers.validateRestRequest.and.returnValue(false);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeFalsy();
    });

    it('should return unauthorised request error', () => {
      args.path = '/api/my/headings/synopsis';

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(finished).toHaveBeenCalledWith({
        error: 'Unauthorised request'
      });
      expect(actual).toBeFalsy();
    });

    it('should return true when phr user access to /api/my endpoint', () => {
      args.path = '/api/my/headings/synopsis';
      args.session.role = 'phrUser';

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeTruthy();
    });

    it('should return true when access to not /api/my endpoint', () => {
      args.path = '/api/feeds';

      q.jwt.handlers.validateRestRequest.and.returnValue(true);

      const actual = rippleCdrOpenEhr.beforeMicroServiceHandler.call(q, args, finished);

      expect(q.jwt.handlers.validateRestRequest).toHaveBeenCalledWithContext(q, args, finished);
      expect(actual).toBeTruthy();
    });
  });

  describe('#workerResponseHandlers', () => {
    describe('restRequest', () => {
      let message;
      let send;

      let getDiscoveryHeadingData;
      let mergeDiscoveryDataInWorker;

      describe('/api/openehr/check', () => {
        beforeEach(() => {
          message = {
            path: '/api/openehr/check',
            status: 'loading_data',
            new_patient: true,
            nhsNumber: 9999999000,
            ewd_application: 'ripple-cdr-openehr',
            token: 'foo.bar.baz'
          };
          send = jasmine.createSpy();

          getDiscoveryHeadingData = jasmine.createSpy();
          mockery.registerMock('./src/getDiscoveryHeadingData', getDiscoveryHeadingData);

          mergeDiscoveryDataInWorker = jasmine.createSpy();
          mockery.registerMock('./src/mergeDiscoveryDataInWorker', mergeDiscoveryDataInWorker);

          rippleCdrOpenEhr = getRippleCdrOpenEhr();
        });

        it('should do nothing when status is ready', () => {
          message.status = 'ready';

          rippleCdrOpenEhr.workerResponseHandlers.restRequest.call(q, message, send);
        });

        it('should do nothing when responseNo > 1', () => {
          message.responseNo = 2;

          rippleCdrOpenEhr.workerResponseHandlers.restRequest.call(q, message, send);
        });

        it('should handle getDiscoveryHeadingData errors ', () => {
          getDiscoveryHeadingData.and.callFake(
            (nhsNumber, heading, token, callback) => callback({
              message: {
                error: 'some error'
              }
            })
          );

          rippleCdrOpenEhr.workerResponseHandlers.restRequest.call(q, message, send);

          expect(getDiscoveryHeadingData).toHaveBeenCalledTimes(3);
          [
            'procedures',
            'vaccinations',
            'finished'
          ].forEach((heading, i) => {
            expect(getDiscoveryHeadingData.calls.thisArgFor(i)).toBe(q);
            expect(getDiscoveryHeadingData.calls.argsFor(i)).toEqual(
              [9999999000, heading, 'foo.bar.baz', jasmine.any(Function)]
            );
          });

          expect(mergeDiscoveryDataInWorker).not.toHaveBeenCalled();
        });

        it('should merge discovery data ', () => {
          getDiscoveryHeadingData.and.callFake(
            (nhsNumber, heading, token, callback) => callback({
              message: {
                results: [
                  `${heading}-results`
                ]
              }
            })
          );

          mergeDiscoveryDataInWorker.and.callFake(
            (nhsNumber, heading, token, discoveryData, callback) => callback()
          );

          rippleCdrOpenEhr.workerResponseHandlers.restRequest.call(q, message, send);

          expect(getDiscoveryHeadingData).toHaveBeenCalledTimes(3);
          expect(mergeDiscoveryDataInWorker).toHaveBeenCalledTimes(3);

          [
            'procedures',
            'vaccinations',
            'finished'
          ].forEach((heading, i) => {
            expect(mergeDiscoveryDataInWorker.calls.thisArgFor(i)).toBe(q);
            expect(mergeDiscoveryDataInWorker.calls.argsFor(i)).toEqual(
              [9999999000, heading, 'foo.bar.baz', [`${heading}-results`], jasmine.any(Function)]
            );
          });
        });
      });
    });
  });
});
