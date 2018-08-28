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

describe('integration/authentication-service-phr:', () => {
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
          expect(res.body).toEqual(
            jasmine.objectContaining({
              ok: true,
              api: 'oauth/test',
              token: jasmine.any(String),
            })
          );
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
          expect(res.body).toEqual(
            jasmine.objectContaining({
              redirectURL: [
                'https://oauth-openid-testing.herokuapp.com/cicauth/realms/NHS/protocol/openid-connect/auth',
                '?client_id=s6BhdRkqt3',
                '&scope=openid',
                '&response_type=code',
                '&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fauth%2Ftoken'
              ].join(''),
              token: jasmine.any(String),
            })
          );
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
          expect(res.body).toEqual(
            jasmine.objectContaining({
              ok: true,
              redirectURL: 'http://localhost:8080',
              token: jasmine.any(String)
            })
          );
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('POST /api/auth/token', () => {
    it('should respond with correct response', (done) => {
      request.
        get('/api/auth/token?code=mzgybGPAr4tGi9fd').
        set('authorization', `Bearer ${token}`).
        expect(200).
        expect(res => {
          /*jshint camelcase: false */
          expect(res.body).toEqual(
            jasmine.objectContaining({
              ok: true,
              qewd_redirect: '/index.html',
              cookiePath: '/',
              cookieName: 'JSESSIONID',
              token: jasmine.any(String)
            })
          );
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
              expect(res.body).toEqual(
                jasmine.objectContaining({
                  ok: true,
                  mode: 'idcr',
                  token: jasmine.any(String)
                })
              );
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
              expect(res.body).toEqual(
                jasmine.objectContaining({
                  ok: true,
                  mode: 'admin',
                  token: jasmine.any(String)
                })
              );
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
          expect(res.body).toEqual(
            jasmine.objectContaining({
              ok: true,
              id: jasmine.any(Number),
              token: jasmine.any(String)
            })
          );
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
          expect(res.body).toEqual(
            jasmine.objectContaining({
              ok: true,
              id: jasmine.any(Number),
              token: jasmine.any(String)
            })
          );
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
          expect(res.body).toEqual(
            jasmine.objectContaining({
              status: jasmine.any(String),
              token: jasmine.any(String)
            })
          );
        }).
        end(err => err ? done.fail(err) : done());
    });
  });
});
