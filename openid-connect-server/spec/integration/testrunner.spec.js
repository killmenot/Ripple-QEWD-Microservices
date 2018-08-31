'use strict';

const url = require('url');
const querystring = require('querystring');
const request = require('supertest');
const cheerio = require('cheerio');

describe('integration/openid-connect-server:', () => {
  const BASE_URL = 'http://10.5.0.2:8080';

  function parseQueryString(uri) {
    const parsed = url.parse(uri);
    return querystring.parse(parsed.query);
  }

  function getQuery() {
    /*jshint camelcase: false */
    return {
      client_id: 'foo',
      scope: 'openid',
      response_type: 'code',
      redirect_uri: 'http://127.0.0.1:8000/api/auth/token'
    };
    /*jshint camelcase: true */
  }

  describe('GET /openid/auth', () => {
    it('should redirect to interaction page', (done) => {
      request(BASE_URL).
        get('/openid/auth').
        query(getQuery()).
        expect(302).
        expect(res => {
          expect(res.headers.location).toMatch(/^\/interaction\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        }).
        end(err => err ? done.fail(err) : done());
    });
  });

  describe('GET /interaction/:grant', () => {
    it('should render login page', (done) => {
      request.
        agent(BASE_URL).
        get('/openid/auth').
        query(getQuery()).
        redirects(1).
        expect(200).
        end((err, res) =>  {
          if (err) {
            return done.fail(err);
          }

          const $ = cheerio.load(res.text);
          expect($('title').text()).toBe('Sign-in');
          expect($('[name=email]')).toBeDefined();
          expect($('[name=password]')).toBeDefined();

          done();
        });
      });
  });

  describe('POST /interaction/:grant/login', () => {
    let interactionUrl;
    let agent;

    beforeEach((done) => {
      agent = request.agent(BASE_URL);
      agent.
        get('/openid/auth').
        query(getQuery()).
        redirects(1).
        expect(200).
        end((err, res) =>  {
          if (err) {
            return done.fail(err);
          }

          interactionUrl = `${res.req.path}/login`;

          done();
        });
    });

    it('should render email must be provided error on login page', (done) => {
      agent.
        post(interactionUrl).
        expect(200).
        expect(res => {
          const $ = cheerio.load(res.text);
          expect($('.grant-debug').text().trim()).toBe('Email must be provided');
        }).
        end(err => err ? done.fail(err) : done());
    });

    it('should render password must be provided error on login page', (done) => {
      agent.
        post(interactionUrl).
        send({
          email: 'test@example.org'
        }).
        expect(200).
        expect(res => {
          const $ = cheerio.load(res.text);
          expect($('.grant-debug').text().trim()).toBe('Password must be provided');
        }).
        end(err => err ? done.fail(err) : done());
    });

    it('should render no such user error on login page', (done) => {
      agent.
        post(interactionUrl).
        send({
          email: 'test@example.org',
          password: 'test'
        }).
        expect(200).
        expect(res => {
          const $ = cheerio.load(res.text);
          expect($('.grant-debug').text().trim()).toBe('No such user');
        }).
        end(err => err ? done.fail(err) : done());
    });

    it('should render no such user error on login page', (done) => {
      agent.
        post(interactionUrl).
        send({
          email: 'test@example.org',
          password: 'test'
        }).
        expect(200).
        expect(res => {
          const $ = cheerio.load(res.text);
          expect($('.grant-debug').text().trim()).toBe('No such user');
        }).
        end(err => err ? done.fail(err) : done());
    });

    it('should redirect to "redirect_uri" with query params when credentials ok', (done) => {
      agent.
        post(interactionUrl).
        send({
          email: 'ivor.cox@ripple.foundation',
          password: 'IvorCox1!'
        }).
        redirects(1).
        expect(302).
        end((err, res) =>  {
          if (err) {
            return done.fail(err);
          }

          const query = parseQueryString(res.headers.location);

          /*jshint camelcase: false */
          expect(res.headers.location).toMatch(/^http:\/\/127\.0\.0\.1:8000\/api\/auth\/token.*/);
          expect(query).toEqual({
            code: jasmine.any(String),
            session_state: jasmine.any(String)
          });
          /*jshint camelcase: true */

          done();
        });
    });
  });

  xdescribe('POST /interaction/:grant/confirm', () => null);

  xdescribe('POST /interaction/logout', () => null);
});
