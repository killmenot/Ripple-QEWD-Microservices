'use strict';

const bcrypt = require('bcrypt');
const Worker = require('../mocks/worker');
const handler = require('../../../admin/register');

describe('ripple-auth/admin/register:', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    q = new Worker();
    jasmine.clock().install();

    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    rippleAdmin.$(['byUsername', 'jane']).value = 4;
    rippleAdmin.$(['nextId']).value = 4;

    args = {
      req: {
        body: {
          username: 'john',
          password: 'secret',
          givenName: 'John',
          familyName: 'Doe',
          email: 'john.doe@example.org',
          userType: 'idcr'
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

  it('should return missing form contents', () => {
    delete args.req.body;

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Missing Form Contents'
    });
  });

  it('should return at least one admin user has been created already (but never happens :D)', () => {
    q.db.use = jasmine.createSpy().and.returnValue({exists: true});

    args.session.userMode = 'addAdminUser';
    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'At least one Admin User has been created already'
    });
  });

  describe('When userType is mailformed', () => {
    it('should return user type must be defined when no userType passed', () => {
      delete args.req.body.userType;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'userType must be defined'
      });
    });

    it('should return user type must be admin or idcr', () => {
      args.req.body.userType = 'quux';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'userType can only be admin or idcr'
      });
    });
  });

  describe('When username is mailformed', () => {
    it('should return username must be entered when no username passed', () => {
      delete args.req.body.username;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a username'
      });
    });

    it('should return invalid username format', () => {
      args.req.body.username = 'not$valid_username';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid username format'
      });
    });

    it('should return username is more than 50 characters', () => {
      args.req.body.username = 'abcfed'.repeat(10);

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Username is more than 50 characters'
      });
    });

    it('should return username is too short', () => {
      args.req.body.username = 'abc';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Username is too short'
      });
    });
  });

  it('should return has already been taken', () => {
    args.req.body.username = 'jane';

    handler.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Username jane has already been taken'
    });
  });

  describe('When password is mailformed', () => {
    it('should return password must be entered when no password passed', () => {
      delete args.req.body.password;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a password'
      });
    });

    it('should return password is too short', () => {
      args.req.body.password = 'abc';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Password is too short'
      });
    });
  });

  describe('When givenName is mailformed', () => {
    it('should return first name must be entered when no givenName passed', () => {
      delete args.req.body.givenName;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a First Name'
      });
    });

    it('should return invalid first name', () => {
      args.req.body.givenName = 'Jo#$';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid First Name'
      });
    });
  });

  describe('When lastName is mailformed', () => {
    it('should return last name must be entered when no familyName passed', () => {
      delete args.req.body.familyName;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter a Last Name'
      });
    });

    it('should return invalid last name', () => {
      args.req.body.familyName = 'Do$%';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid Last Name'
      });
    });
  });

  describe('When email is mailformed', () => {
    it('should return email must be entered when no email passed', () => {
      delete args.req.body.email;

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'You must enter an Email Address'
      });
    });

    it('should return invalid email address when email is not valid', () => {
      args.req.body.email = '$#*';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid Email Address'
      });
    });

    it('should return invalid email address when email is more than 255 characters', () => {
      args.req.body.email = 'john'.repeat(65) + '@example.org';

      handler.call(q, args, finished);

      expect(finished).toHaveBeenCalledWith({
        error: 'Invalid Email Address'
      });
    });
  });

  it('should register a new user', () => {
    const expected = {
      id: 5,
      createdAt: '2018-01-01T00:00:00.000Z',
      updatedAt: '2018-01-01T00:00:00.000Z',
      username: 'john',
      password: jasmine.any(String),
      type: 'idcr',
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.org'
    };

    const nowTime = Date.UTC(2018, 0, 1); // 1514764800000, now
    jasmine.clock().mockDate(new Date(nowTime));

    handler.call(q, args, finished);

    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    expect(rippleAdmin.$(['byUsername', 'john']).value).toBe(expected.id);

    const user = rippleAdmin.$(['byId', 5]).getDocument();
    expect(user).toEqual(expected);

    const match = bcrypt.compareSync(args.req.body.password, user.password);
    expect(match).toBeTruthy();

    expect(finished).toHaveBeenCalledWith({
      ok: true,
      id: 5
    });
  });

  it('should register a admin user', () => {
    const expected = {
      id: 1,
      createdAt: '2018-01-01T00:00:00.000Z',
      updatedAt: '2018-01-01T00:00:00.000Z',
      username: 'john',
      password: jasmine.any(String),
      type: 'admin',
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.org'
    };

    const nowTime = Date.UTC(2018, 0, 1); // 1514764800000, now
    jasmine.clock().mockDate(new Date(nowTime));

    q.db.reset();

    delete args.req.body.userType;
    args.session.userMode = 'addAdminUser';

    handler.call(q, args, finished);

    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    expect(rippleAdmin.$(['byUsername', 'john']).value).toBe(expected.id);

    const user = rippleAdmin.$(['byId', 1]).getDocument();
    expect(user).toEqual(expected);

    const match = bcrypt.compareSync(args.req.body.password, user.password);
    expect(match).toBeTruthy();

    expect(finished).toHaveBeenCalledWith({
      ok: true,
      id: 1
    });
  });
});
