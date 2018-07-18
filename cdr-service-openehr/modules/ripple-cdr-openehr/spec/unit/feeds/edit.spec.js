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
const edit = require('../../../lib/feeds/edit');

describe('ripple-cdr-openehr/lib/feeds/edit', () => {
  let q;
  let args;
  let finished;

  const feed = {
    author: 'bob.smith@gmail.com',
    dateCreated: 1527663973204,
    email: 'ivor.cox@ripple.foundation',
    landingPageUrl: 'https://www.nytimes.com/section/health',
    name: 'NYTimes.com',
    rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
  };

  beforeEach(() => {
    const nowTime = Date.UTC(2018, 0, 1); // 1514764800000, now
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(nowTime));

    q = new Worker();

    args = {
      sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
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

  beforeEach(() => {
    const phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');
    phrFeeds.$(['bySourceId', args.sourceId]).setDocument(feed);
  });

  afterEach(() => {
    q.db.reset();
    jasmine.clock().uninstall();
  });

  it('should return missing or empty sourceId error', () => {
    delete args.sourceId;

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Missing or empty sourceId'
    });
  });

  it('should return invalid sourceId error', () => {
    args.sourceId = 'foo-bar-baz-quux';

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid sourceId'
    });
  });

  it('should return author missing or empty error', () => {
    delete args.req.body.author;

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Author missing or empty'
    });
  });

  it('should return feed name missing or empty error', () => {
    delete args.req.body.name;

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Feed name missing or empty'
    });
  });

  it('should return landing page URL missing or empty error', () => {
    delete args.req.body.landingPageUrl;

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Landing page URL missing or empty'
    });
  });

  it('should return landing page URL is invalid error', () => {
    args.req.body.landingPageUrl = 'foo';

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Landing page URL is invalid'
    });
  });

  it('should return RSS Feed URL missing or empty error', () => {
    delete args.req.body.rssFeedUrl;

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'RSS Feed URL missing or empty'
    });
  });

  it('should return RSS Feed URL is invalid error', () => {
    args.req.body.rssFeedUrl = 'foo';

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'RSS Feed URL is invalid'
    });
  });

  it('should update feed', () => {
    const expected = {
      author: 'ivor.cox@phr.leeds.nhs',
      name: 'BBC News',
      landingPageUrl: 'https://www.bbc.co.uk/news',
      rssFeedUrl: 'https://www.bbc.co.uk/rss',
      email: 'jane.doe@example.org',
      sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
      dateCreated: 1514764800000
    };

    edit.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
    });

    const phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');
    const actual = phrFeeds.$(['bySourceId', args.sourceId]).getDocument();

    expect(actual).toEqual(expected);
  });
});
