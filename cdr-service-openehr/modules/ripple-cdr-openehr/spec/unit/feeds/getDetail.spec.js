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
const getDetail = require('../../../lib/feeds/getDetail');

const feed = {
  author: 'bob.smith@gmail.com',
  dateCreated: 1527663973204,
  email: 'ivor.cox@ripple.foundation',
  landingPageUrl: 'https://www.nytimes.com/section/health',
  name: 'NYTimes.com',
  rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
  sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
};

describe('ripple-cdr-openehr/lib/feeds/getDetail', () => {
  let q;
  let args;
  let finished;

  beforeEach(() => {
    q = new Worker();

    args = {
      sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d',
      session: {
        email: 'ivor.cox@ripple.foundation'
      }
    };
    finished = jasmine.createSpy();

    const phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');
    phrFeeds.$(['bySourceId', args.sourceId]).setDocument(feed);
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return missing or empty sourceId error', () => {
    delete args.sourceId;

    getDetail.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Missing or empty sourceId'
    });
  });

  it('should return invalid sourceId error', () => {
    args.sourceId = 'foobar';

    getDetail.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      error: 'Invalid sourceId'
    });
  });

  it('should return feed details', () => {
    getDetail.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      feed: feed
    });
  });
});
