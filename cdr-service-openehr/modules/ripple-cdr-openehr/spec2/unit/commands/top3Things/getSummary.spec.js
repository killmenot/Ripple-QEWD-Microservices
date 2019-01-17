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
const { BadRequestError } = require('../../../../lib2/errors');
const { Role } = require('../../../../lib2/shared/enums');
const { GetTop3ThingsSummaryCommand } = require('../../../../lib2/commands/top3Things');

describe('ripple-cdr-openehr/lib/commands/top3Things/getSummary', () => {
  let ctx;
  let session;
  let patientId;

  let top3ThingsService;

  beforeEach(() => {
    ctx = new ExecutionContextMock();
    session = {
      nhsNumber: 9999999000,
      role: 'admin'
    };
    patientId = 9999999111;

    top3ThingsService = ctx.services.top3ThingsService;
    top3ThingsService.getLatestSummaryByPatientId.and.resolveValue({
      source: 'QEWDDB',
      sourceId: 'ce437b97-4f6e-4c96-89bb-0b58b29a79cb',
      dateCreated: 1519851600000,
      name1: 'foo1',
      name2: 'foo2',
      name3: 'foo3'
    });

    ctx.services.freeze();
  });

  it('should throw invalid or missing patientId error', async () => {
    patientId = 'foo';

    const command = new GetTop3ThingsSummaryCommand(ctx, session);
    const actual = command.execute(patientId);

    await expectAsync(actual).toBeRejectedWith(new BadRequestError('patientId foo is invalid'));
  });

  it('should return latest top 3 things summary', async () => {
    const expected = {
      source: 'QEWDDB',
      sourceId: 'ce437b97-4f6e-4c96-89bb-0b58b29a79cb',
      dateCreated: 1519851600000,
      name1: 'foo1',
      name2: 'foo2',
      name3: 'foo3'
    };

    const command = new GetTop3ThingsSummaryCommand(ctx, session);
    const actual = await command.execute(patientId);

    expect(top3ThingsService.getLatestSummaryByPatientId).toHaveBeenCalledWith(9999999111);
    expect(actual).toEqual(expected);
  });

  it('should return latest top 3 things summary when user has phrUser role', async () => {
    const expected = {
      source: 'QEWDDB',
      sourceId: 'ce437b97-4f6e-4c96-89bb-0b58b29a79cb',
      dateCreated: 1519851600000,
      name1: 'foo1',
      name2: 'foo2',
      name3: 'foo3'
    };

    session.role = Role.PHR_USER;

    const command = new GetTop3ThingsSummaryCommand(ctx, session);
    const actual = await command.execute(patientId);

    expect(top3ThingsService.getLatestSummaryByPatientId).toHaveBeenCalledWith(9999999000);
    expect(actual).toEqual(expected);
  });
});
