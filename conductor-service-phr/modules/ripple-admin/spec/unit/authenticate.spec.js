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

const Worker = require('../mocks/worker');
const authenticate = require('../../lib/authenticate');

describe('ripple-admin/lib/authenticate', () => {
  let q;
  let args;
  let finished;

  const user = {
    email: 'john.doe@example.org',
    username: 'johndoe',
    password: '$2b$10$QXCYrXZdY3X0ebZNe8jKo..yC.AWVtyEmqqXzYW4rQbxpOTHbnlOC',
    follows: '<secret>'
  };

  beforeEach(() => {
    q = new Worker();

    const conduitUsers = new q.documentStore.DocumentNode('conduitUsers');
    conduitUsers.$(['byEmail', 'john.doe@example.org']).value = 4;
    conduitUsers.$(['byId', 4]).setDocument(user);

    args = {
      req: {
        body: {
          user: {
            email: 'john.doe@example.org',
            password: '123456'
          }
        }
      }
    };
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return body cannot be empty error', () => {
    delete args.req.body;

    authenticate.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: {
        response: {
          errors: {
            body: ['can\'t be empty']
          }
        }
      },
      status: {
        code: '422'
      }
    });
  });

  describe('When email is mailformed', () => {
    it('should return email must be defined error', () => {
      delete args.req.body.user.email;

      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              email: ['must be defined']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return email is invalid error when email is not valid email', () => {
      args.req.body.user.email = 'invalid';

      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              'email': ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return email is invalid error when email is more than 255 characters long', () => {
      args.req.body.user.email = 'abcfed'.repeat(50) + '@example.org';

      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              'email': ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });
  });

  describe('When password is mailformed', () => {
    it('should return password must be defined error', () => {
      delete args.req.body.user.password;

      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              password: ['must be defined']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return password must be 6 or more characters in length error', () => {
      args.req.body.user.password = '12345';

      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              'password': ['must be 6 or more characters in length']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });
  });

  describe('When email does not exist', () => {
    beforeEach(() => {
      args.req.body.user.email = 'jane.doe@example.org';
    });

    it('should return email or password invalid error', () => {
      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              'email or password': ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });
  });

  describe('When password mismatch', () => {
    beforeEach(() => {
      args.req.body.user.password = 'quuuux';
    });

    it('should return email or password invalid error', () => {
      authenticate.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              'email or password': ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });
  });

  it('should return correct response', () => {
    const session = {
      jwt: 'jwt.token'
    };
    q.sessions.create.and.returnValue(session);

    authenticate.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      user: {
        email: 'john.doe@example.org',
        username: 'johndoe',
        token: 'jwt.token'
      }
    });
  });

  it('should update QEWD session', () => {
    const session = {
      jwt: 'jwt.token'
    };
    q.sessions.create.and.returnValue(session);

    authenticate.call(q, args, finished);

    expect(q.sessions.create).toHaveBeenCalledWith({
      application: 'conduit',
      timeout: 5184000,
      jwtPayload: {
        id: 4,
        username: 'johndoe'
      }
    });
    expect(session.authenticated).toBeTruthy();
  });
});
