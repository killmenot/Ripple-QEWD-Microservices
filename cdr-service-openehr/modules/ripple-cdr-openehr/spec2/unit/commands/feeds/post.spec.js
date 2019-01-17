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

  19 December 2018

*/

'use strict';

const { ExecutionContextMock } = require('../../../mocks');
const { BadRequestError } = require('../../../../lib2/errors');
const { PostFeedCommand } = require('../../../../lib2/commands/feeds');

describe('ripple-cdr-openehr/lib/commands/feeds/post', () => {
  let ctx;
  let session;
  let payload;

  let phrFeedService;

  beforeEach(() => {
    ctx = new ExecutionContextMock();
    session = {
      nhsNumber: 9999999000,
      email: 'john.doe@example.org'
    };

    payload = {
      author: 'ivor.cox@phr.leeds.nhs',
      name: 'BBC News',
      landingPageUrl: 'https://www.bbc.co.uk/news',
      rssFeedUrl: 'https://www.bbc.co.uk/rss'
    };

    phrFeedService = ctx.services.phrFeedService;

    ctx.services.freeze();
  });

  it('should throw author missing or empty error', async () => {
    delete payload.author;

    const command = new PostFeedCommand(ctx, session);
    const actual = command.execute(payload);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('Author missing or empty'));
  });

  it('should throw feed name missing or empty error', async () => {
    delete payload.name;

    const command = new PostFeedCommand(ctx, session);
    const actual = command.execute(payload);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('Feed name missing or empty'));
  });

  it('should throw landing page URL missing or empty error', async () => {
    delete payload.landingPageUrl;

    const command = new PostFeedCommand(ctx, session);
    const actual = command.execute(payload);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('Landing page URL missing or empty'));
  });

  it('should throw landing page URL is invalid error', async () => {
    payload.landingPageUrl = 'foo';

    const command = new PostFeedCommand(ctx, session);
    const actual = command.execute(payload);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('Landing page URL is invalid'));
  });

  it('should throw RSS Feed URL missing or empty error', async () => {
    delete payload.rssFeedUrl;

    const command = new PostFeedCommand(ctx, session);
    const actual = command.execute(payload);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('RSS Feed URL missing or empty'));
  });

  it('should throw RSS Feed URL is invalid error', async () => {
    payload.rssFeedUrl = 'foo';

    const command = new PostFeedCommand(ctx, session);
    const actual = command.execute(payload);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('RSS Feed URL is invalid'));
  });

  it('should create feed and return response', async () => {
    const expected = 'eaf394a9-5e05-49c0-9c69-c710c77eda76';

    const sourceId = 'eaf394a9-5e05-49c0-9c69-c710c77eda76';
    phrFeedService.create.and.resolveValues(sourceId);

    const command = new PostFeedCommand(ctx, session);
    const actual = await command.execute(payload);

    expect(phrFeedService.create).toHaveBeenCalledWith({
      author: 'ivor.cox@phr.leeds.nhs',
      name: 'BBC News',
      landingPageUrl: 'https://www.bbc.co.uk/news',
      rssFeedUrl: 'https://www.bbc.co.uk/rss',
      email: 'john.doe@example.org'
    });

    expect(actual).toEqual(expected);
  });
});
