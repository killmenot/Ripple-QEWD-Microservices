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

  22 December 2018

*/

'use strict';

const { ExecutionContextMock } = require('../../../mocks');
const { GetFeedsSummaryCommand } = require('../../../../lib2/commands/feeds');

describe('ripple-cdr-openehr/lib/commands/feeds/getSummary', () => {
  let ctx;
  let session;

  let phrFeedService;

  beforeEach(() => {
    ctx = new ExecutionContextMock();
    session = {
      nhsNumber: 9999999000,
      email: 'john.doe@example.org'
    };

    phrFeedService = ctx.services.phrFeedService;

    ctx.services.freeze();
  });

  it('should return feeds', async () => {
    const expected = [
      {
        landingPageUrl: 'https://www.nytimes.com/section/health',
        name: 'NYTimes.com',
        rssFeedUrl: 'http://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
        sourceId: '0f7192e9-168e-4dea-812a-3e1d236ae46d'
      },
      {
        landingPageUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/',
        name: 'Leeds Live - Whats on',
        rssFeedUrl: 'https://www.leeds-live.co.uk/best-in-leeds/whats-on-news/?service=rss',
        sourceId: '260a7be5-e00f-4b1e-ad58-27d95604d010'
      }
    ];

    phrFeedService.getByEmail.and.resolveValue(expected);

    const command = new GetFeedsSummaryCommand(ctx, session);
    const actual = await command.execute();

    expect(phrFeedService.getByEmail).toHaveBeenCalledWith('john.doe@example.org');

    expect(actual).toEqual(expected);
  });
});
