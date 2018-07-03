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

const bcrypt = require('bcrypt');
const Worker = require('../mocks/worker');
const register = require('../../lib/register');

describe('ripple-admin/lib/register', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    const nowTime = Date.UTC(2018, 0, 1); // 1514764800000, now
    jasmine.clock().mockDate(new Date(nowTime));
    jasmine.clock().install();

    q = new Worker();

    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    rippleAdmin.$(['byUsername', 'jane']).value = 4;
    rippleAdmin.$(['byEmail', 'jane.doe@example.org']).value = 4;
    rippleAdmin.$(['nextId']).value = 4;

    args = {
      req: {
        body: {
          user: {
            username: 'john',
            email: 'john.doe@example.org',
            password: '123456'
          }
        }
      },
      session: {}
    };
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
    jasmine.clock().uninstall();
  });

  it('should return body cannot be empty error', () => {
    delete args.req.body;

    register.call(q, args, finished);

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

  describe('When username is mailformed', () => {
    it('should return username must be defined error', () => {
      delete args.req.body.user.username;

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              username: ['must be defined']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return username is invalid error when not valid characters used', () => {
      args.req.body.user.username = 'not$valid_username';

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              username: ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return username is invalid error when it is more than 50 characters', () => {
      args.req.body.user.username = 'abcfed'.repeat(10);

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              username: ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return username has already been taken error', () => {
      args.req.body.user.username = 'jane';

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              username: ['has already been taken']
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

      register.call(q, args, finished);

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

    it('should return password must be 6 or more characters error', () => {
      args.req.body.user.password = 'abc';

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              password: ['must be 6 or more characters in length']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });
  });


  describe('When email is mailformed', () => {
    it('should return email must be defined error', () => {
      delete args.req.body.user.email;

      register.call(q, args, finished);

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

    it('should return email is invalid error when email is not valid', () => {
      args.req.body.user.email = '$#*';

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              email: ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return email is invalid error when email is more than 255 characters', () => {
      args.req.body.user.email = 'john'.repeat(65) + '@example.org';

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              email: ['is invalid']
            }
          }
        },
        status: {
          code: '422'
        }
      });
    });

    it('should return email has already been taken error', () => {
      args.req.body.user.email = 'jane.doe@example.org';

      register.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: {
          response: {
            errors: {
              email: ['has already been taken']
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
    const expected = {
      user: {
        id: 5,
        email: 'john.doe@example.org',
        username: 'john',
        createdAt: '2018-01-01T00:00:00.000Z',
        updatedAt: '2018-01-01T00:00:00.000Z',
        bio: '',
        image: '',
        token: 'jwt.token'
      }
    };

    const session = {
      jwt: 'jwt.token',
      data: new q.documentStore.DocumentNode('ewdSession', ['session', '0-0-0-0'])
    };
    q.sessions.create.and.returnValue(session);

    register.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith(expected);
  });

  it('should initialize QEWD session', () => {
    const session = {
      jwt: 'jwt.token',
      data: new q.documentStore.DocumentNode('ewdSession', ['session', '0-0-0-0'])
    };
    q.sessions.create.and.returnValue(session);

    register.call(q, args, finished);

    expect(q.sessions.create).toHaveBeenCalledWith({
      application: 'conduit',
      timeout: 5184000,
      jwtPayload: {
        id: 5,
        username: 'john'
      }
    });
    expect(session.authenticated).toBeTruthy();
    expect(session.data.$(['conduit', 'userId']).value).toBe(5);
  });

  it('should create user in the storage', () => {
    const session = {
      jwt: 'jwt.token',
      data: new q.documentStore.DocumentNode('ewdSession', ['session', '0-0-0-0'])
    };
    q.sessions.create.and.returnValue(session);

    register.call(q, args, finished);

    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    const user = rippleAdmin.$(['byId', 5]).getDocument();

    expect(rippleAdmin.$(['byUsername', 'john']).value).toBe(5);
    expect(rippleAdmin.$(['byEmail', 'john.doe@example.org']).value).toBe(5);
    expect(user).toEqual({
      id: 5,
      createdAt: '2018-01-01T00:00:00.000Z',
      updatedAt: '2018-01-01T00:00:00.000Z',
      username: 'john',
      password: jasmine.any(String),
      email: 'john.doe@example.org',
      bio: '',
      image: ''
    });

    const match = bcrypt.compareSync(args.req.body.user.password, user.password);
    expect(match).toBeTruthy();
  });
});
