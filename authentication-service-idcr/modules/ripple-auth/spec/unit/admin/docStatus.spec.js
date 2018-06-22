/*

 ----------------------------------------------------------------------------
 | ripple-auth: Ripple Authentication MicroServices                         |
 |                                                                          |
 | Copyright (c) 2018 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  22 June 2018

*/

'use strict';

const handler = require('../../../admin/docStatus');
const Worker = require('../mocks/worker');

describe('ripple-auth/admin/docStatus', () => {
  let q;
  let finished;

  beforeEach(() => {
    q = new Worker();

    spyOn(q.db, 'use').and.callThrough();
    finished = jasmine.createSpy();
  });

  afterEach(() => {
    q.db.reset();
  });

  it('should return empty status', () => {

    const args = {};
    handler.call(q, args, finished);

    expect(q.db.use).toHaveBeenCalledWith('RippleAdmin');
    expect(finished).toHaveBeenCalledWith({
      status: 'docEmpty'
    });
  });

  it('should return initial status', () => {
    const rippleAdmin = new q.documentStore.DocumentNode('RippleAdmin');
    rippleAdmin.value = 'foo';

    const args = {};
    handler.call(q, args, finished);

    expect(q.db.use).toHaveBeenCalledWith('RippleAdmin');
    expect(finished).toHaveBeenCalledWith({
      status: 'initial'
    });
  });
});
