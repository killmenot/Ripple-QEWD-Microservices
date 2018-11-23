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

const Worker = require('../../mocks/worker');
const post = require('../../../lib/feeds/post');

describe('ripple-cdr-openehr/lib/feeds/post', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    const nowTime = Date.UTC(2018, 0, 1); // 1514764800000, now
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(nowTime));

    q = new Worker();

    args = {
      req: {
        body: {
          author: 'ivor.cox@phr.leeds.nhs',
          name: 'BBC News',
          landingPageUrl: 'https://www.bbc.co.uk/news',
          rssFeedUrl: 'https://www.bbc.co.uk/rss'
        }
      },
      session: {
        email: 'jane.doe@example.org'
      }
    };
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
    jasmine.clock().uninstall();
  });

  it('should return author missing or empty error', () => {
    delete args.req.body.author;

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Author missing or empty'
    });
  });

  it('should return feed name missing or empty error', () => {
    delete args.req.body.name;

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Feed name missing or empty'
    });
  });

  it('should return landing page URL missing or empty error', () => {
    delete args.req.body.landingPageUrl;

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Landing page URL missing or empty'
    });
  });

  it('should return landing page URL is invalid error', () => {
    args.req.body.landingPageUrl = 'foo';

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Landing page URL is invalid'
    });
  });

  it('should return RSS Feed URL missing or empty error', () => {
    delete args.req.body.rssFeedUrl;

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'RSS Feed URL missing or empty'
    });
  });

  it('should return RSS Feed URL is invalid error', () => {
    args.req.body.rssFeedUrl = 'foo';

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'RSS Feed URL is invalid'
    });
  });

  it('should create feed', () => {
    const expected = {
      author: 'ivor.cox@phr.leeds.nhs',
      name: 'BBC News',
      landingPageUrl: 'https://www.bbc.co.uk/news',
      rssFeedUrl: 'https://www.bbc.co.uk/rss',
      email: 'jane.doe@example.org',
      sourceId: jasmine.any(String),
      dateCreated: 1514764800000
    };

    post.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      sourceId: jasmine.any(String)
    });

    const phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');
    const sourceId = finished.calls.argsFor(0)[0].sourceId;

    expect(phrFeeds.$(['bySourceId', sourceId]).getDocument()).toEqual(expected);
    expect(phrFeeds.$(['byEmail', args.session.email, sourceId]).value).toBe(true);
  });

  it('should handle name duplication', () => {
    post.call(q, args, finished);
    post.call(q, args, finished);

    const sourceId = finished.calls.allArgs()[0][0].sourceId;
    const phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');

    const expected = {};
    expected[sourceId] = {
      author: 'ivor.cox@phr.leeds.nhs',
      dateCreated: 1514764800000,
      email: 'jane.doe@example.org',
      landingPageUrl: 'https://www.bbc.co.uk/news',
      name: 'BBC News',
      rssFeedUrl: 'https://www.bbc.co.uk/rss',
      sourceId: sourceId
    };

    expect(phrFeeds.$(['bySourceId']).getDocument()).toEqual(expected)
  })

  it('should handle urls duplication', () => {
    post.call(q, args, finished);

    args.req.body.name = 'CNN News'
    post.call(q, args, finished);

    const sourceId = finished.calls.allArgs()[0][0].sourceId;
    const phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');

    const expected = {};
    expected[sourceId] = {
      author: 'ivor.cox@phr.leeds.nhs',
      dateCreated: 1514764800000,
      email: 'jane.doe@example.org',
      landingPageUrl: 'https://www.bbc.co.uk/news',
      name: 'BBC News',
      rssFeedUrl: 'https://www.bbc.co.uk/rss',
      sourceId: sourceId
    };

    expect(phrFeeds.$(['bySourceId']).getDocument()).toEqual(expected)
  })
});
