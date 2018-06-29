'use strict';

const path = require('path');
const faker = require('faker');
const request = require('supertest')('http://localhost:8080');
const rawRequest = require('request');
const utils = require('../helpers/utils');

faker.qewd = {
  register: (userType) => {
    const clean = (x) => x.replace(/\.|_/, '');

    return {
      username: clean(faker.internet.userName()),
      password: faker.internet.password(),
      userType: userType,
      givenName: faker.name.firstName(),
      familyName: faker.name.lastName(),
      email: faker.internet.email()
    };
  }
};

describe('integration/authentication-service-idcr:', () => {
  let cp;
  let token = '';

  const options = {
    cwd: path.join(__dirname, 'local')
  };

  beforeAll((done) => {
    cp = utils.fork('./qewd', options, done);
  });

  beforeAll((done) => {
    request
      .get('/api/auth/login')
      .end((err, res) => {
        if (err) {
          return done.fail(err);
        }

        const options = {
          method: 'GET',
          url: res.body.redirectURL,
          json: true
        };

        rawRequest(options, (err, res) => {
          if (err) {
            return done.fail(err);
          }

          token = res.body.token;
          done();
        });
      });
  });

  afterAll((done) => {
    utils.exit(cp, done);
  });

  describe('GET /api/auth/test', () => {
    it('should respond with correct response', (done) => {
      request.
        get('/api/auth/test').
        set('authorization', `Bearer ${token}`).
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            ok: true,
            api: 'auth/test',
            type: 'Auth0',
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('GET /api/auth/login', () => {
    it('should respond with redirect URL in response', (done) => {
      request.
        get('/api/auth/login').
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            redirectURL: [
              'https://auth0-testing.herokuapp.com/authorize',
              '?scope=openid profile email',
              '&response_type=code',
              '&connections[0]=Username-Password-Authentication',
              '&connections[1]=google-oauth2',
              '&connections[2]=twitter',
              '&sso=true',
              '&client_id=yyyyyyyyyyyyyyyyyyyyyyyyyy',
              '&redirect_uri=http://127.0.0.1:8080/api/auth/token',
              '&auth0Client=eyJuYW1lIjoicWV3ZC1jbGllbnQiLCJ2ZXJzaW9uIjoiMS4yNi4wIn0='
            ].join(''),
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('GET /api/auth/logout', () => {
    it('should respond with correct response', (done) => {
      request.
        get('/api/auth/logout').
        set('authorization', `Bearer ${token}`).
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            ok: true,
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('GET /api/auth/demo', () => {
    it('should respond with correct response', (done) => {
      request.
        get('/api/auth/demo').
        set('authorization', `Bearer ${token}`).
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            ok: true,
            api: 'auth/demo',
            type: 'Auth0',
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('POST /api/auth/token', () => {
    it('should respond with correct response', (done) => {
      request.
        get('/api/auth/token').
        set('authorization', `Bearer ${token}`).
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            ok: true,
            qewd_redirect: '/index.html',
            cookiePath: '/',
            cookieName: 'JSESSIONID',
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('POST /api/auth/admin/login', () => {
    it('should be able to login as idcr user credentials', (done) => {
      const data = faker.qewd.register('idcr');

      request.
        post('/api/auth/admin/register').
        set('authorization', `Bearer ${token}`).
        send(data).
        end(err => {
          if (err) {
            return done.fail(err);
          }

          request.
            post('/api/auth/admin/login').
            send({
              username: data.username,
              password: data.password
            }).
            expect(200).
            expect(res => {
              expect(res.body).toEqual({
                ok: true,
                mode: 'idcr',
                token: jasmine.any(String)
              });
            }).
            end(err => err ? done.fail(err) : done());
        });
    });

    it('should be able to login as admin user credentials', (done) => {
      const data = faker.qewd.register('admin');

      request.
        post('/api/auth/admin/register').
        set('authorization', `Bearer ${token}`).
        send(data).
        end(err => {
          if (err) {
            return done.fail(err);
          }

          request.
            post('/api/auth/admin/login').
            send({
              username: data.username,
              password: data.password
            }).
            expect(200).
            expect(res => {
              expect(res.body).toEqual({
                ok: true,
                mode: 'admin',
                token: jasmine.any(String)
              });
            }).
            end(err => err ? done.fail(err) : done());
        });
    });
  });

  describe('POST /api/auth/admin/register', () => {
    it('should be able to register a new idrc user', (done) => {
      const data = faker.qewd.register('idcr');

      request.
        post('/api/auth/admin/register').
        set('authorization', `Bearer ${token}`).
        send(data).
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            ok: true,
            id: jasmine.any(Number),
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });

    it('should be able to register a new admin user', (done) => {
      const data = faker.qewd.register('admin');

      request.
        post('/api/auth/admin/register').
        set('authorization', `Bearer ${token}`).
        send(data).
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            ok: true,
            id: jasmine.any(Number),
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('GET /api/auth/docStatus', () => {
    it('should respond with correct response', (done) => {
      request.
        get('/api/auth/admin/docStatus').
        expect(200).
        expect(res => {
          expect(res.body).toEqual({
            status: jasmine.any(String),
            token: jasmine.any(String)
          });
        }).
        end(err => err ? done.fail(err) : done());
    });
  });
});
