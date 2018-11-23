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
const getSummary = require('../../../lib/feeds/getSummary');

const sourceIds = [
  '0f7192e9-168e-4dea-812a-3e1d236ae46d',
  '260a7be5-e00f-4b1e-ad58-27d95604d010'
];
const feeds = {
  '0f7192e9-168e-4dea-812a-3e1d236ae46d': {
    author: 'bob.smith@gmail.com',
    dateCreated: 1527663973204,
    email: 'ivor.cox@ripple.foundation',
    landingPageUrl: 'https://www.nytimes.com/section/health',
    name: 'NYTimes.com',
    rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
  },
  '260a7be5-e00f-4b1e-ad58-27d95604d010': {
    author: 'bob.smith@gmail.com',
    dateCreated: 1527605220395,
    email: 'ivor.cox@ripple.foundation',
    landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
    name: 'Leeds Live - Whats on',
    rssFeedUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/?service=rss',
    sourceId: '260a7be5-e00f-4b1e-ad58-27d95604d010'
  }
};

describe('ripple-cdr-openehr/lib/feeds/getSummary', () => {
  let q;
  let args;
  let finished;

  let phrFeeds;

  beforeEach(() => {
    q = new Worker();

    args = {
      session: {
        email: 'ivor.cox@ripple.foundation'
      }
    };
    finished = jasmine.createSpy();

    phrFeeds = new q.documentStore.DocumentNode('PHRFeeds');
    sourceIds.forEach(sourceId => {
      phrFeeds.$(['byEmail', args.session.email, sourceId]).value = 'true';
      phrFeeds.$(['bySourceId', sourceId]).setDocument(feeds[sourceId]);
    });
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return feeds', () => {
    const feeds = [
      {
        name: 'NYTimes.com',
        landingPageUrl: 'https://www.nytimes.com/section/health',
        rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
        sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
      },
      {
        name: 'Leeds Live - Whats on',
        landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
        rssFeedUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/?service=rss',
        sourceId: '260a7be5-e00f-4b1e-ad58-27d95604d010'
      }
    ];

    getSummary.call(q, args, finished);

    expect(finished).toHaveBeenCalledWith({
      feeds: feeds
    });
  });

  it('should remove names duplication', () => {
    sourceIds.forEach(sourceId => {
      phrFeeds.$(['byEmail', 'ivor.cox@ripple.foundation', '3020ad3c-8072-4b38-95f7-d8adbbbfb07a']).value = 'true';
      phrFeeds.$(['bySourceId', '3020ad3c-8072-4b38-95f7-d8adbbbfb07a']).setDocument({
        author: 'bob.smith@gmail.com',
        dateCreated: 1527663973204,
        email: 'ivor.cox@ripple.foundation',
        landingPageUrl: 'https://www.nytimes.com/section/health',
        name: 'NYTimes.com',
        rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
        sourceId: '3020ad3c-8072-4b38-95f7-d8adbbbfb07a'
      });
    });

    getSummary.call(q, args, finished);

    expect(phrFeeds.$(['byEmail', 'ivor.cox@ripple.foundation']).getDocument()).toEqual({
      '0f7192e9-168e-4dea-812a-3e1d236ae46d': true,
      '260a7be5-e00f-4b1e-ad58-27d95604d010': true
    });
    expect(phrFeeds.$(['bySourceId']).getDocument()).toEqual({
      '0f7192e9-168e-4dea-812a-3e1d236ae46d': {
        author: 'bob.smith@gmail.com',
        dateCreated: 1527663973204,
        email: 'ivor.cox@ripple.foundation',
        landingPageUrl: 'https://www.nytimes.com/section/health',
        name: 'NYTimes.com',
        rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
        sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
      },
      '260a7be5-e00f-4b1e-ad58-27d95604d010': {
        author: 'bob.smith@gmail.com',
        dateCreated: 1527605220395,
        email: 'ivor.cox@ripple.foundation',
        landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
        name: 'Leeds Live - Whats on',
        rssFeedUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/?service=rss',
        sourceId: '260a7be5-e00f-4b1e-ad58-27d95604d010'
      }
    });
  });

  it('should remove urls duplication', () => {
    sourceIds.forEach(sourceId => {
      phrFeeds.$(['byEmail', 'ivor.cox@ripple.foundation', '3020ad3c-8072-4b38-95f7-d8adbbbfb07a']).value = 'true';
      phrFeeds.$(['bySourceId', '3020ad3c-8072-4b38-95f7-d8adbbbfb07a']).setDocument({
        author: 'bob.smith@gmail.com',
        dateCreated: 1527663973204,
        email: 'ivor.cox@ripple.foundation',
        landingPageUrl: 'https://www.nytimes.com/section/health',
        name: 'UKTimes.com',
        rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
        sourceId: '3020ad3c-8072-4b38-95f7-d8adbbbfb07a'
      });
    });

    getSummary.call(q, args, finished);

    expect(phrFeeds.$(['byEmail', 'ivor.cox@ripple.foundation']).getDocument()).toEqual({
      '0f7192e9-168e-4dea-812a-3e1d236ae46d': true,
      '260a7be5-e00f-4b1e-ad58-27d95604d010': true
    });
    expect(phrFeeds.$(['bySourceId']).getDocument()).toEqual({
      '0f7192e9-168e-4dea-812a-3e1d236ae46d': {
        author: 'bob.smith@gmail.com',
        dateCreated: 1527663973204,
        email: 'ivor.cox@ripple.foundation',
        landingPageUrl: 'https://www.nytimes.com/section/health',
        name: 'NYTimes.com',
        rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
        sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
      },
      '260a7be5-e00f-4b1e-ad58-27d95604d010': {
        author: 'bob.smith@gmail.com',
        dateCreated: 1527605220395,
        email: 'ivor.cox@ripple.foundation',
        landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
        name: 'Leeds Live - Whats on',
        rssFeedUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/?service=rss',
        sourceId: '260a7be5-e00f-4b1e-ad58-27d95604d010'
      }
    });
  });
});
